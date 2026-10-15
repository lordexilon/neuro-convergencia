// A deliberately small text-only subset. HTML and links are never interpreted.
function inlineParts(value) {
  return String(value ?? '').split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).filter(Boolean).map(text => {
    if (text.startsWith('**') && text.endsWith('**') && text.length > 4) return {kind: 'strong', text: text.slice(2, -2)};
    if (text.startsWith('*') && text.endsWith('*') && text.length > 2) return {kind: 'em', text: text.slice(1, -1)};
    return {kind: 'text', text};
  });
}
module.exports = {inlineParts};
