import { matchRegex, type RegexRequest } from './developer-regex'

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<RegexRequest>) => void) | null
  postMessage: (value: unknown) => void
}
scope.onmessage = (event) => {
  try {
    scope.postMessage({ result: matchRegex(event.data) })
  } catch (error) {
    scope.postMessage({
      error: error instanceof Error ? error.message : 'invalidPattern',
    })
  }
}
