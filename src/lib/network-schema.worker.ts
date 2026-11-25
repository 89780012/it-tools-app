import { NetworkToolError, validateJsonSchema } from './network-additions'

self.onmessage = (event: MessageEvent<{ schema: string; data: string }>) => {
  try {
    const { schema, data } = event.data
    if (schema.length > 200000 || data.length > 200000)
      throw new NetworkToolError('schemaError')
    self.postMessage({ result: validateJsonSchema(schema, data) })
  } catch (error) {
    self.postMessage({
      error: error instanceof NetworkToolError ? error.code : 'schemaError',
    })
  }
}
