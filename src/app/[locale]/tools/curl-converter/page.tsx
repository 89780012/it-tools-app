"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface ParsedCurl {
  url: string
  method: string
  headers: Record<string, string>
  data?: string
  queryParams?: Record<string, string>
}

function parseCurlCommand(curlCommand: string): ParsedCurl | null {
  const cleanCommand = curlCommand.trim()
  
  if (!cleanCommand.toLowerCase().includes('curl')) {
    return null
  }

  const result: ParsedCurl = {
    url: '',
    method: 'GET',
    headers: {}
  }

  // 移除 'curl' 前缀
  let command = cleanCommand.replace(/^curl\s+/i, '')
  
  // 解析 URL
  const urlMatch = command.match(/(?:['"])(https?:\/\/[^'"]+)(?:['"])|(?:\s|^)(https?:\/\/\S+)/)
  if (urlMatch) {
    result.url = urlMatch[1] || urlMatch[2]
    command = command.replace(urlMatch[0], '')
  }

  // 解析 -X 或 --request (HTTP方法)
  const methodMatch = command.match(/(?:-X|--request)\s+['"]?(\w+)['"]?/)
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase()
    command = command.replace(methodMatch[0], '')
  }

  // 解析 -H 或 --header (请求头)
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/g
  let headerMatch
  while ((headerMatch = headerRegex.exec(command)) !== null) {
    const headerStr = headerMatch[1]
    const colonIndex = headerStr.indexOf(':')
    if (colonIndex > 0) {
      const key = headerStr.substring(0, colonIndex).trim()
      const value = headerStr.substring(colonIndex + 1).trim()
      result.headers[key] = value
    }
  }

  // 解析 -d 或 --data (请求体)
  const dataMatch = command.match(/(?:-d|--data|--data-raw)\s+['"]([^'"]+)['"]/)
  if (dataMatch) {
    result.data = dataMatch[1]
    if (!result.method || result.method === 'GET') {
      result.method = 'POST'
    }
  }

  if (!result.url) {
    return null
  }

  return result
}

function generateJavaScriptFetch(parsed: ParsedCurl): string {
  const options: string[] = []
  options.push(`  method: '${parsed.method}'`)
  
  if (Object.keys(parsed.headers).length > 0) {
    const headersStr = Object.entries(parsed.headers)
      .map(([key, value]) => `    '${key}': '${value}'`)
      .join(',\n')
    options.push(`  headers: {\n${headersStr}\n  }`)
  }
  
  if (parsed.data) {
    options.push(`  body: '${parsed.data}'`)
  }
  
  return `fetch('${parsed.url}', {\n${options.join(',\n')}\n})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`
}

function generatePythonRequests(parsed: ParsedCurl): string {
  let code = `import requests\n\n`
  code += `url = '${parsed.url}'\n`
  
  if (Object.keys(parsed.headers).length > 0) {
    code += `headers = {\n`
    Object.entries(parsed.headers).forEach(([key, value]) => {
      code += `    '${key}': '${value}',\n`
    })
    code += `}\n`
  }
  
  if (parsed.data) {
    code += `data = '${parsed.data}'\n`
  }
  
  code += `\nresponse = requests.${parsed.method.toLowerCase()}(url`
  if (Object.keys(parsed.headers).length > 0) {
    code += `, headers=headers`
  }
  if (parsed.data) {
    code += `, data=data`
  }
  code += `)\nprint(response.json())`
  
  return code
}

function generateNodeJsAxios(parsed: ParsedCurl): string {
  let code = `const axios = require('axios');\n\n`
  code += `axios({\n`
  code += `  method: '${parsed.method.toLowerCase()}',\n`
  code += `  url: '${parsed.url}',\n`
  
  if (Object.keys(parsed.headers).length > 0) {
    code += `  headers: {\n`
    Object.entries(parsed.headers).forEach(([key, value]) => {
      code += `    '${key}': '${value}',\n`
    })
    code += `  },\n`
  }
  
  if (parsed.data) {
    code += `  data: '${parsed.data}'\n`
  }
  
  code += `})
  .then(response => console.log(response.data))
  .catch(error => console.error('Error:', error));`
  
  return code
}

function generatePHPCurl(parsed: ParsedCurl): string {
  let code = `<?php\n\n`
  code += `$curl = curl_init();\n\n`
  code += `curl_setopt_array($curl, [\n`
  code += `  CURLOPT_URL => '${parsed.url}',\n`
  code += `  CURLOPT_RETURNTRANSFER => true,\n`
  code += `  CURLOPT_CUSTOMREQUEST => '${parsed.method}',\n`
  
  if (parsed.data) {
    code += `  CURLOPT_POSTFIELDS => '${parsed.data}',\n`
  }
  
  if (Object.keys(parsed.headers).length > 0) {
    code += `  CURLOPT_HTTPHEADER => [\n`
    Object.entries(parsed.headers).forEach(([key, value]) => {
      code += `    '${key}: ${value}',\n`
    })
    code += `  ],\n`
  }
  
  code += `]);\n\n`
  code += `$response = curl_exec($curl);\n`
  code += `curl_close($curl);\n\n`
  code += `echo $response;`
  
  return code
}

function generateGoHttp(parsed: ParsedCurl): string {
  let code = `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"\n`
  if (parsed.data) {
    code += `\t"strings"\n`
  }
  code += `)\n\nfunc main() {\n`
  
  if (parsed.data) {
    code += `\tpayload := strings.NewReader(\`${parsed.data}\`)\n\n`
    code += `\treq, _ := http.NewRequest("${parsed.method}", "${parsed.url}", payload)\n`
  } else {
    code += `\treq, _ := http.NewRequest("${parsed.method}", "${parsed.url}", nil)\n`
  }
  
  if (Object.keys(parsed.headers).length > 0) {
    code += `\n`
    Object.entries(parsed.headers).forEach(([key, value]) => {
      code += `\treq.Header.Add("${key}", "${value}")\n`
    })
  }
  
  code += `\n\tres, _ := http.DefaultClient.Do(req)\n`
  code += `\tdefer res.Body.Close()\n`
  code += `\tbody, _ := io.ReadAll(res.Body)\n\n`
  code += `\tfmt.Println(string(body))\n}`
  
  return code
}

export default function CurlConverterPage() {
  const t = useTranslations()

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [testResult, setTestResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const convertCurl = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const parsed = parseCurlCommand(input)
      
      if (!parsed) {
        setError(t("tools.curl-converter.invalid_command"))
        setOutput("")
        return
      }
      
      let code = ""
      switch (language) {
        case "javascript":
          code = generateJavaScriptFetch(parsed)
          break
        case "python":
          code = generatePythonRequests(parsed)
          break
        case "nodejs":
          code = generateNodeJsAxios(parsed)
          break
        case "php":
          code = generatePHPCurl(parsed)
          break
        case "go":
          code = generateGoHttp(parsed)
          break
        default:
          code = generateJavaScriptFetch(parsed)
      }
      
      setOutput(code)
      setError("")
    } catch (err) {
      console.error(err)
      setError(t("tools.curl-converter.conversion_failed"))
      setOutput("")
    }
  }

  const testRequest = async () => {
    if (!input.trim()) {
      return
    }

    setIsLoading(true)
    setTestResult("")

    try {
      const parsed = parseCurlCommand(input)
      
      if (!parsed) {
        setTestResult(t("tools.curl-converter.test_failed"))
        setIsLoading(false)
        return
      }

      // 使用代理API发送请求，避免CORS问题
      const proxyResponse = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: parsed.url,
          method: parsed.method,
          headers: parsed.headers,
          data: parsed.data,
        }),
      })

      const proxyData = await proxyResponse.json()

      if (!proxyResponse.ok) {
        setTestResult(`${t("tools.curl-converter.test_failed")}: ${proxyData.message || proxyData.error}`)
        setIsLoading(false)
        return
      }

      const { status, statusText, body } = proxyData
      
      let formattedResponse = body
      try {
        const jsonData = JSON.parse(body)
        formattedResponse = JSON.stringify(jsonData, null, 2)
      } catch {
        // 不是JSON格式，保持原样
      }

      setTestResult(`状态: ${status} ${statusText}\n\n${formattedResponse}`)
    } catch (err) {
      setTestResult(`${t("tools.curl-converter.test_failed")}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError("")
    setTestResult("")
  }

  const downloadCode = () => {
    if (output) {
      const extensions: Record<string, string> = {
        javascript: 'js',
        python: 'py',
        nodejs: 'js',
        php: 'php',
        go: 'go'
      }
      const ext = extensions[language] || 'txt'
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `request.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.curl-converter.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.curl-converter.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.curl-converter.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.curl-converter.input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (error) {
                  setError("")
                }
              }}
              placeholder={t("tools.curl-converter.input_placeholder")}
              className={getTextareaClasses('input', !error)}
            />

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <Label>{t("tools.curl-converter.language_label")}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript (Fetch)</SelectItem>
                  <SelectItem value="nodejs">Node.js (Axios)</SelectItem>
                  <SelectItem value="python">Python (Requests)</SelectItem>
                  <SelectItem value="php">PHP (cURL)</SelectItem>
                  <SelectItem value="go">Go (net/http)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={convertCurl} className="flex-1">
                {t("tools.curl-converter.convert_button")}
              </Button>
              <Button 
                onClick={testRequest} 
                variant="outline" 
                className="flex-1"
                disabled={isLoading}
              >
                <Play className="h-4 w-4 mr-2" />
                {t("tools.curl-converter.test_button")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.curl-converter.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.curl-converter.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.curl-converter.output_placeholder")}
              className={getTextareaClasses('output')}
            />

            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                disabled={!output}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button
                onClick={downloadCode}
                variant="outline"
                disabled={!output}
                size="icon"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.curl-converter.test_result_title")}</CardTitle>
            <CardDescription>
              {t("tools.curl-converter.test_result_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={testResult}
              readOnly
              className={getTextareaClasses('output')}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO内容区域 */}
      <ToolSEOSection toolId="curl-converter" />
    </div>
  )
}

