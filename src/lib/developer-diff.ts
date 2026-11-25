export interface DiffLine {
  kind: ' ' | '+' | '-'
  text: string
}
export function normalizeDiffText(text: string, ignoreWhitespace: boolean) {
  const normalized = text.replace(/\r\n/g, '\n')
  return ignoreWhitespace
    ? normalized
        .split('\n')
        .map((line) => line.trim().replace(/[\t ]+/g, ' '))
        .join('\n')
    : normalized
}
function lines(text: string) {
  return text.match(/[^\n]*\n|[^\n]+$/g) ?? []
}

export function compareTexts(
  left: string,
  right: string,
  ignoreWhitespace = false,
) {
  left = normalizeDiffText(left, ignoreWhitespace)
  right = normalizeDiffText(right, ignoreWhitespace)
  const a = lines(left),
    b = lines(right)
  if (
    left.length + right.length > 100_000 ||
    (a.length + 1) * (b.length + 1) > 2_000_000
  )
    throw new Error('tooLarge')
  const width = b.length + 1
  const matrix = new Uint32Array((a.length + 1) * width)
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) {
      matrix[i * width + j] =
        a[i] === b[j]
          ? 1 + matrix[(i + 1) * width + j + 1]
          : Math.max(matrix[(i + 1) * width + j], matrix[i * width + j + 1])
    }
  const changes: DiffLine[] = []
  let i = 0,
    j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      changes.push({ kind: ' ', text: a[i++] })
      j++
    } else if (
      i < a.length &&
      (j === b.length ||
        matrix[(i + 1) * width + j] >= matrix[i * width + j + 1])
    )
      changes.push({ kind: '-', text: a[i++] })
    else changes.push({ kind: '+', text: b[j++] })
  }
  const equal = left === right
  const unified = equal
    ? ''
    : `--- left\n+++ right\n@@ -${a.length ? 1 : 0},${a.length} +${b.length ? 1 : 0},${b.length} @@\n` +
      changes
        .map(
          (change) =>
            `${change.kind}${change.text.endsWith('\n') ? change.text : `${change.text}\n\\ No newline at end of file\n`}`,
        )
        .join('')
  return { left, right, equal, changes, unified }
}
