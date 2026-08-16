import { useEffect, useState } from 'react'
import '@/styles/Contact.css'

/**
 * Declarative Web-MCP form.
 *
 * `toolname` + `tooldescription` turn the form into a tool the browser
 * registers automatically — zero JavaScript. No `toolautosubmit`: the
 * browser (or an agent) fills the fields but a human must press Send.
 * Native human-in-the-loop.
 *
 * The Web-MCP attributes are spread into the JSX: they are not standard
 * HTML attributes, but React passes unknown props through to the DOM, and
 * spreading keeps them type-safe without touching the React type surface.
 *
 * The `company_website` field is a honeypot: hidden by CSS. Previously we thought
 * omitting `toolparamdescription` would hide it from WebMCP's schema, but Chrome
 * includes all non-hidden inputs regardless. Therefore, we explicitly add a
 * `toolparamdescription` instructing agents NOT to fill it. A cooperative Web-MCP
 * agent reads the description and leaves it blank; an aggressive scraper gets blocked.
 *
 * Submission is a REAL navigation (no JS): the Cloudflare Pages Function
 * always answers 303 See Other, even on validation or delivery failure,
 * so the browser never lands on a raw JSON response. The component reads the
 * `?contact=` query param after the reload and renders inline feedback:
 *   ok       → success message
 *   invalid  → validation error, ask the user to retry
 *   error    → server-side failure, ask the user to retry later
 */

const FORM_TOOL_ATTRS = {
  toolname: 'contact-knot-team',
  tooldescription:
    'Send a message to the Knot maintainers about support, bug reports or general questions.',
} as const

const EMAIL_TOOL_ATTRS = {
  toolparamtitle: 'Email',
  toolparamdescription: 'Reply-to address of the person contacting the team',
} as const

const TOPIC_TOOL_ATTRS = {
  toolparamdescription: 'Category: support | bug | other',
} as const

const MESSAGE_TOOL_ATTRS = {
  toolparamdescription: 'Body of the message',
} as const

const HONEYPOT_TOOL_ATTRS = {
  toolparamdescription: 'Honeypot field. Agents and humans MUST leave this empty.',
} as const

function Contact() {
  const [status, setStatus] = useState<'ok' | 'invalid' | 'error' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const contact = params.get('contact')
    if (contact === 'ok' || contact === 'invalid' || contact === 'error') {
      setStatus(contact)
      history.replaceState(null, '', window.location.pathname + '#/contact')
    }
  }, [])

  return (
    <section id="contact" className="contact page" aria-labelledby="contact-title">
      <div className="container">
        <h2 className="section-title" id="contact-title">
          Contact the team
        </h2>
        <p className="section-subtitle">
          Questions about support, bug reports, or the project itself. The form is also
          exposed as a Web-MCP tool — agents can fill it, humans decide when to send.
        </p>

        {status === 'ok' && (
          <p className="contact__success" role="status">
            Message sent. The team will get back to you at the address you provided.
          </p>
        )}

        {status === 'invalid' && (
          <p className="contact__error" role="alert">
            Please check your message and email address, then try again. The message must be
            between 10 and 5000 characters.
          </p>
        )}

        {status === 'error' && (
          <p className="contact__error" role="alert">
            Something went wrong on our side. Please try again in a few minutes.
          </p>
        )}

        <form
          {...FORM_TOOL_ATTRS}
          action="/api/contact"
          method="post"
          className="contact__form"
        >
          <div className="contact__field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              {...EMAIL_TOOL_ATTRS}
            />
          </div>

          <div className="contact__field">
            <label htmlFor="contact-topic">Topic</label>
            <select id="contact-topic" name="topic" {...TOPIC_TOOL_ATTRS}>
              <option value="support">Support</option>
              <option value="bug">Bug report</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="contact__field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={6}
              {...MESSAGE_TOOL_ATTRS}
            />
          </div>

          <div className="contact__hp" aria-hidden="true">
            <label htmlFor="contact-website">Company website</label>
            <input
              id="contact-website"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              {...HONEYPOT_TOOL_ATTRS}
            />
          </div>

          <button type="submit" className="contact__submit">
            Send message
          </button>
        </form>
      </div>
    </section>
  )
}

export default Contact
