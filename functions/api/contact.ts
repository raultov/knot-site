import type { PagesFunction } from '@cloudflare/workers-types'

/**
 * Contact form handler (Cloudflare Pages Function, mounted at /api/contact).
 *
 * Why Pages Functions and not a third-party form service: same origin, so
 * `form-action 'self'` and `connect-src 'self'` in public/_headers hold — the
 * CSP does not need to change. That is the entire reason.
 *
 * Flow:
 * - Native form POST arrives as application/x-www-form-urlencoded
 *   → request.formData().
 * - Honeypot: if company_website is non-empty, the POST is blocked (400).
 *   Cooperative Web-MCP agents never fill it because it has no
 *   toolparamdescription and therefore is not part of the generated schema.
 * - Server-side validation always, with structured JSON errors (what an
 *   agent needs to react to a failure).
 * - Success → 303 See Other → /?contact=ok#contact, a real navigation the
 *   SPA consumes after reload.
 * - Email via Resend. Rate limiting is a Cloudflare dashboard rule (the
 *   function is stateless), not code.
 */

interface Env {
  RESEND_API_KEY: string
  CONTACT_TO_EMAIL: string
}

const TOPICS = new Set(['support', 'bug', 'other'])

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

async function sendEmail(env: Env, payload: { email: string; topic: string; message: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Knot Website <noreply@knot.kz>',
      to: [env.CONTACT_TO_EMAIL],
      reply_to: payload.email,
      subject: `[knot.kz contact] ${payload.topic}`,
      text: `From: ${payload.email}\nTopic: ${payload.topic}\n\n${payload.message}`,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Resend HTTP ${res.status}: ${detail.slice(0, 300)}`)
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return jsonResponse(
      { ok: false, error: 'invalid-form-data', message: 'Expected form-encoded body.' },
      400,
    )
  }

  const email = String(form.get('email') ?? '').trim()
  const topic = String(form.get('topic') ?? 'other').trim()
  const message = String(form.get('message') ?? '').trim()
  const honeypot = String(form.get('company_website') ?? '').trim()

  if (honeypot) {
    return jsonResponse(
      { ok: false, error: 'spam-detected', message: 'Request rejected.' },
      400,
    )
  }

  const fieldErrors: Record<string, string> = {}
  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = 'A valid email address is required.'
  }
  if (!TOPICS.has(topic)) {
    fieldErrors.topic = 'Unknown topic.'
  }
  if (message.length < 10 || message.length > 5000) {
    fieldErrors.message = 'Message must be between 10 and 5000 characters.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    const url = new URL(request.url)
    const redirect = new URL('/?contact=invalid#/contact', url.origin)
    return Response.redirect(redirect.toString(), 303)
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    return jsonResponse(
      { ok: false, error: 'not-configured', message: 'Contact delivery is not configured.' },
      503,
    )
  }

  try {
    await sendEmail(env, { email, topic, message })
  } catch (err) {
    console.error('[contact] email delivery failed:', err)
    const url = new URL(request.url)
    const redirect = new URL('/?contact=error#/contact', url.origin)
    return Response.redirect(redirect.toString(), 303)
  }

  const url = new URL(request.url)
  const redirect = new URL('/?contact=ok#/contact', url.origin)
  return Response.redirect(redirect.toString(), 303)
}
