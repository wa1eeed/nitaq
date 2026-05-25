/**
 * Lightweight markdown → HTML renderer for legal pages.
 */
function escape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}
export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inUl = false, inOl = false, inBq = false;
  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };
  const closeBq = () => { if (inBq) { out.push('</blockquote>'); inBq = false; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#\s/.test(line))   { closeLists(); closeBq(); out.push(`<h1>${escape(line.replace(/^#\s/, ''))}</h1>`);  continue; }
    if (/^##\s/.test(line))  { closeLists(); closeBq(); out.push(`<h2>${escape(line.replace(/^##\s/, ''))}</h2>`); continue; }
    if (/^###\s/.test(line)) { closeLists(); closeBq(); out.push(`<h3>${escape(line.replace(/^###\s/, ''))}</h3>`); continue; }
    if (/^>\s?/.test(line)) {
      closeLists();
      if (!inBq) { out.push('<blockquote>'); inBq = true; }
      out.push(`<p>${inline(escape(line.replace(/^>\s?/, '')))}</p>`);
      continue;
    } else { closeBq(); }
    if (/^-\s/.test(line)) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${inline(escape(line.replace(/^-\s/, '')))}</li>`);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${inline(escape(line.replace(/^\d+\.\s/, '')))}</li>`);
      continue;
    }
    closeLists();
    if (line.trim() === '') { out.push(''); continue; }
    out.push(`<p>${inline(escape(line))}</p>`);
  }
  closeLists(); closeBq();
  return out.join('\n');
}

interface MarkdownProps { content: string }
export function Markdown({ content }: MarkdownProps) {
  return (
    <div
      className="leading-relaxed [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:mt-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_p]:mb-4 [&_p]:text-base [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:mb-4 [&_li]:mb-1.5 [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_blockquote]:border-s-4 [&_blockquote]:border-primary/40 [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
