/**
 * Declarative Web-MCP attributes of the contact form (see `Contact.tsx`).
 *
 * Kept outside the component so the build-time generator can advertise the
 * same tool name, description and parameters in llms.txt without bundling
 * React or CSS.
 */

export const CONTACT_FORM_TOOL_ATTRS = {
  toolname: 'contact-knot-team',
  tooldescription:
    'Send a message to the Knot maintainers about support, bug reports or general questions.',
} as const

/** Per-field attributes, keyed by the input `name` they are spread onto. */
export const CONTACT_FORM_PARAM_ATTRS = {
  email: {
    toolparamtitle: 'Email',
    toolparamdescription: 'Reply-to address of the person contacting the team',
  },
  topic: {
    toolparamdescription: 'Category: support | bug | other',
  },
  message: {
    toolparamdescription: 'Body of the message',
  },
  company_website: {
    toolparamdescription: 'Honeypot field. Agents and humans MUST leave this empty.',
  },
} as const
