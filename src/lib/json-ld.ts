// Serializes structured data for <script type="application/ld+json" dangerouslySetInnerHTML>.
// JSON.stringify does not escape `<`, so a string containing `</script>` would end the script
// element and let the rest run as HTML. Escaping `<` (and the JS line separators U+2028/U+2029)
// keeps every value inside the JSON, whatever the content source becomes later.
// Built from char codes so no editor or tool turns the separators into raw line breaks.
const UNSAFE = new RegExp(`[<${String.fromCharCode(0x2028, 0x2029)}]`, 'g')

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
}
