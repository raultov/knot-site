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
 * The `company_website` field is a honeypot: hidden by CSS and deliberately
 * WITHOUT a `toolparamdescription`, so it never appears in the JSON Schema
 * the browser generates. A cooperative Web-MCP agent never sees it and sends
 * nothing; a visual scraper that fills every input it finds gets blocked by
 * the server.
 *
 * Submission is a REAL navigation (no JS): the Cloudflare Pages Function
 * answers 303 See Other → /?contact=ok#contact, and this component reads the
 * query param after the reload.
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

function Contact() {
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('contact') === 'ok') {
      setShowSuccess(true)
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

        {showSuccess && (
          <p className="contact__success" role="status">
            Message sent. The team will get back to you at the address you provided.
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
