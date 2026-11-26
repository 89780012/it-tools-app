export interface StreamEvent {
  event: string
  data: string
  id: string
}
export class SSEParser {
  private buffer = ''
  private event = ''
  private data: string[] = []
  private id = ''
  private dataSize = 0
  private started = false
  push(chunk: string): StreamEvent[] {
    if (!this.started && chunk) {
      chunk = chunk.replace(/^\uFEFF/, '')
      this.started = true
    }
    this.buffer += chunk
    if (this.buffer.length > 1_000_000) throw new Error('tooLarge')
    const events: StreamEvent[] = []
    let match: RegExpExecArray | null
    while ((match = /\r\n|\r|\n/.exec(this.buffer))) {
      if (match[0] === '\r' && match.index === this.buffer.length - 1) break
      const line = this.buffer.slice(0, match.index)
      this.buffer = this.buffer.slice(match.index + match[0].length)
      if (line === '') {
        if (this.data.length)
          events.push({
            event: this.event || 'message',
            data: this.data.join('\n'),
            id: this.id,
          })
        this.event = ''
        this.data = []
        this.dataSize = 0
      } else if (!line.startsWith(':')) {
        const at = line.indexOf(':')
        const field = at < 0 ? line : line.slice(0, at)
        const value = at < 0 ? '' : line.slice(at + 1).replace(/^ /, '')
        if (field === 'data') {
          this.data.push(value)
          this.dataSize += value.length
        }
        if (field === 'event') this.event = value
        if (field === 'id' && !value.includes('\0')) this.id = value
      }
      if (this.dataSize > 1_000_000) throw new Error('tooLarge')
    }
    return events
  }
}
export function validateStreamUrl(
  input: string,
  protocol: 'websocket' | 'sse',
) {
  const url = new URL(input)
  if (
    url.username ||
    url.password ||
    url.hash ||
    !(
      protocol === 'websocket' ? ['ws:', 'wss:'] : ['http:', 'https:']
    ).includes(url.protocol)
  )
    throw new Error('invalid')
  return url.toString()
}
