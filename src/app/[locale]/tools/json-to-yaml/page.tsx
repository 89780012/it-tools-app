"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import * as yaml from 'js-yaml'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

export default function JsonYamlConverterPage() {
  const t = useTranslations();

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [mode, setMode] = useState<'json-to-yaml' | 'yaml-to-json'>('json-to-yaml')

  const convertJsonToYaml = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const parsed = JSON.parse(input)
      const yamlOutput = yaml.dump(parsed, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
        quotingType: '"'
      })
      setOutput(yamlOutput)
      setError("")
    } catch {
      setError(t("tools.json-to-yaml.invalid_json"))
      setOutput("")
    }
  }

  const convertYamlToJson = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const parsed = yaml.load(input)
      const jsonOutput = JSON.stringify(parsed, null, 2)
      setOutput(jsonOutput)
      setError("")
    } catch {
      setError(t("tools.json-to-yaml.invalid_yaml"))
      setOutput("")
    }
  }

  const handleConvert = () => {
    if (mode === 'json-to-yaml') {
      convertJsonToYaml()
    } else {
      convertYamlToJson()
    }
  }

  const switchMode = () => {
    setMode(mode === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml')
    // 清空输入输出
    setInput(output)
    setOutput("")
    setError("")
  }

  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output)
    }
  }

  const downloadFile = () => {
    if (output) {
      const extension = mode === 'json-to-yaml' ? 'yaml' : 'json'
      const blob = new Blob([output], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `converted.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const clearAll = () => {
    setInput("")
    setOutput("")
    setError("")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.json-to-yaml.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.json-to-yaml.description")}
        </p>
      </div>

      <div className="flex gap-2 items-center justify-center">
        <Button
          onClick={switchMode}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeftRight className="h-4 w-4" />
          {mode === 'json-to-yaml' ? 'JSON → YAML' : 'YAML → JSON'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'json-to-yaml' ? t("tools.json-to-yaml.input_title") : t("tools.json-to-yaml.yaml_input_title")}
            </CardTitle>
            <CardDescription>
              {mode === 'json-to-yaml' ? t("tools.json-to-yaml.input_desc") : t("tools.json-to-yaml.yaml_input_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError("")
              }}
              placeholder={mode === 'json-to-yaml' ? t("tools.json-to-yaml.placeholder") : t("tools.json-to-yaml.yaml_placeholder")}
              className={getTextareaClasses('input')}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={handleConvert} className="flex-1">
                {t("common.convert")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'json-to-yaml' ? t("tools.json-to-yaml.output_title") : t("tools.json-to-yaml.json_output_title")}
            </CardTitle>
            <CardDescription>
              {mode === 'json-to-yaml' ? t("tools.json-to-yaml.output_desc") : t("tools.json-to-yaml.json_output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={mode === 'json-to-yaml' ? t("tools.json-to-yaml.output_placeholder") : t("tools.json-to-yaml.json_output_placeholder")}
              className={getTextareaClasses('output')}
            />
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1" disabled={!output}>
                <Copy className="h-4 w-4 mr-2" />
                {t("common.copy")}
              </Button>
              <Button onClick={downloadFile} variant="outline" className="flex-1" disabled={!output}>
                <Download className="h-4 w-4 mr-2" />
                {t("common.download")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO 优化内容 */}
      <ToolSEOSection toolId="json-to-yaml" />
    </div>
  )
}
