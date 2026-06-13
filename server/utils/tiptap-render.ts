// Minimal, dependency-free Tiptap-document → HTML renderer.
//
// doxa-global only displays prayer content (it never edits it), so pulling in
// the full Tiptap/ProseMirror stack would be dead weight. This walks the doc
// JSON returned by campaigns-sever and emits sanitized HTML for the node types
// that actually appear in prayer content: paragraphs, headings, text with
// marks, lists, blockquotes, and the custom `verse` node.
//
// Text is HTML-escaped. Content originates from campaigns-sever's
// admin-authored library (trusted), but escaping keeps stray markup inert.

interface TiptapMark {
  type: string
  attrs?: Record<string, unknown>
}

interface TiptapNode {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: TiptapMark[]
  content?: TiptapNode[]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}

const MARK_TAGS: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strike: 's',
  code: 'code',
  superscript: 'sup',
  subscript: 'sub'
}

function applyMarks(text: string, marks?: TiptapMark[]): string {
  if (!marks || marks.length === 0) return text
  let out = text
  for (const mark of marks) {
    if (mark.type === 'link') {
      const href = escapeAttr(String(mark.attrs?.href ?? '#'))
      out = `<a href="${href}" target="_blank" rel="noopener noreferrer">${out}</a>`
    } else {
      const tag = MARK_TAGS[mark.type]
      if (tag) out = `<${tag}>${out}</${tag}>`
    }
  }
  return out
}

function renderNodes(nodes?: TiptapNode[]): string {
  if (!nodes) return ''
  return nodes.map(renderNode).join('')
}

function renderNode(node: TiptapNode): string {
  switch (node.type) {
    case 'doc':
      return renderNodes(node.content)
    case 'text':
      return applyMarks(escapeHtml(node.text ?? ''), node.marks)
    case 'paragraph':
      return `<p>${renderNodes(node.content)}</p>`
    case 'heading': {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 2), 1), 6)
      return `<h${level}>${renderNodes(node.content)}</h${level}>`
    }
    case 'hardBreak':
      return '<br>'
    case 'bulletList':
      return `<ul>${renderNodes(node.content)}</ul>`
    case 'orderedList':
      return `<ol>${renderNodes(node.content)}</ol>`
    case 'listItem':
      return `<li>${renderNodes(node.content)}</li>`
    case 'blockquote':
      return `<blockquote>${renderNodes(node.content)}</blockquote>`
    case 'verse': {
      const ref = node.attrs?.reference ? String(node.attrs.reference) : ''
      const translation = node.attrs?.translation ? String(node.attrs.translation) : ''
      const cite = [ref, translation].filter(Boolean).join(' · ')
      const body = renderNodes(node.content)
      const citation = cite ? `<cite class="doxa-verse__ref">${escapeHtml(cite)}</cite>` : ''
      return `<div class="doxa-verse">${body}${citation}</div>`
    }
    default:
      // Unknown block: render its children so nothing is silently dropped.
      return renderNodes(node.content)
  }
}

export function renderTiptap(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return ''
  return renderNode(doc as TiptapNode)
}
