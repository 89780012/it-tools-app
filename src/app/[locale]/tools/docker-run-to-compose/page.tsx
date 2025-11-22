"use client"

import { useState } from "react"
import { Copy, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { getTextareaClasses } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { ToolSEOSection } from "@/components/seo/tool-seo-section"

interface DockerComposeService {
  image: string
  container_name?: string
  ports?: string[]
  volumes?: string[]
  environment?: string[]
  restart?: string
  network_mode?: string
  working_dir?: string
  user?: string
  command?: string | string[]
  entrypoint?: string | string[]
  networks?: string[]
  links?: string[]
  depends_on?: string[]
  [key: string]: unknown
}

interface DockerCompose {
  version: string
  services: {
    [key: string]: DockerComposeService
  }
}

function parseDockerRunCommand(command: string): DockerCompose | null {
  // 移除多余的空格和换行符
  const cleanCommand = command.trim().replace(/\s+/g, ' ')
  
  // 检查是否是有效的 docker run 命令
  if (!cleanCommand.startsWith('docker run')) {
    return null
  }

  // 移除 'docker run' 部分
  const args = cleanCommand.substring(10).trim()
  
  const service: DockerComposeService = {
    image: ''
  }
  
  let serviceName = 'app'
  
  // 解析参数
  const tokens: string[] = []
  let current = ''
  let inQuotes = false
  let quoteChar = ''
  
  for (let i = 0; i < args.length; i++) {
    const char = args[i]
    
    if ((char === '"' || char === "'") && (i === 0 || args[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar) {
        inQuotes = false
        quoteChar = ''
      }
      continue
    }
    
    if (char === ' ' && !inQuotes) {
      if (current) {
        tokens.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }
  
  if (current) {
    tokens.push(current)
  }
  
  // 解析 tokens
  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]
    
    if (token === '-d' || token === '--detach') {
      // 后台运行，不需要在 compose 中体现
      i++
    } else if (token === '-p' || token === '--publish') {
      i++
      if (i < tokens.length) {
        if (!service.ports) service.ports = []
        service.ports.push(tokens[i])
      }
      i++
    } else if (token.startsWith('-p=') || token.startsWith('--publish=')) {
      const value = token.split('=')[1]
      if (!service.ports) service.ports = []
      service.ports.push(value)
      i++
    } else if (token === '-v' || token === '--volume') {
      i++
      if (i < tokens.length) {
        if (!service.volumes) service.volumes = []
        service.volumes.push(tokens[i])
      }
      i++
    } else if (token.startsWith('-v=') || token.startsWith('--volume=')) {
      const value = token.split('=')[1]
      if (!service.volumes) service.volumes = []
      service.volumes.push(value)
      i++
    } else if (token === '-e' || token === '--env') {
      i++
      if (i < tokens.length) {
        if (!service.environment) service.environment = []
        service.environment.push(tokens[i])
      }
      i++
    } else if (token.startsWith('-e=') || token.startsWith('--env=')) {
      const value = token.split('=')[1]
      if (!service.environment) service.environment = []
      service.environment.push(value)
      i++
    } else if (token === '--name') {
      i++
      if (i < tokens.length) {
        serviceName = tokens[i]
        service.container_name = tokens[i]
      }
      i++
    } else if (token.startsWith('--name=')) {
      const value = token.split('=')[1]
      serviceName = value
      service.container_name = value
      i++
    } else if (token === '--restart') {
      i++
      if (i < tokens.length) {
        service.restart = tokens[i]
      }
      i++
    } else if (token.startsWith('--restart=')) {
      service.restart = token.split('=')[1]
      i++
    } else if (token === '--network') {
      i++
      if (i < tokens.length) {
        service.network_mode = tokens[i]
      }
      i++
    } else if (token.startsWith('--network=')) {
      service.network_mode = token.split('=')[1]
      i++
    } else if (token === '--workdir' || token === '-w') {
      i++
      if (i < tokens.length) {
        service.working_dir = tokens[i]
      }
      i++
    } else if (token.startsWith('--workdir=') || token.startsWith('-w=')) {
      service.working_dir = token.split('=')[1]
      i++
    } else if (token === '--user' || token === '-u') {
      i++
      if (i < tokens.length) {
        service.user = tokens[i]
      }
      i++
    } else if (token.startsWith('--user=') || token.startsWith('-u=')) {
      service.user = token.split('=')[1]
      i++
    } else if (token === '--entrypoint') {
      i++
      if (i < tokens.length) {
        service.entrypoint = tokens[i]
      }
      i++
    } else if (token.startsWith('--entrypoint=')) {
      service.entrypoint = token.split('=')[1]
      i++
    } else if (token === '--link') {
      i++
      if (i < tokens.length) {
        if (!service.links) service.links = []
        service.links.push(tokens[i])
      }
      i++
    } else if (token.startsWith('--link=')) {
      if (!service.links) service.links = []
      service.links.push(token.split('=')[1])
      i++
    } else if (!token.startsWith('-')) {
      // 这应该是镜像名称
      service.image = token
      i++
      // 剩余的参数作为 command
      if (i < tokens.length) {
        service.command = tokens.slice(i)
      }
      break
    } else {
      // 跳过未识别的参数
      i++
    }
  }
  
  if (!service.image) {
    return null
  }
  
  return {
    version: '3.8',
    services: {
      [serviceName]: service
    }
  }
}

function generateYamlFromCompose(compose: DockerCompose): string {
  let yaml = `version: '${compose.version}'\n\n`
  yaml += 'services:\n'
  
  for (const [name, service] of Object.entries(compose.services)) {
    yaml += `  ${name}:\n`
    yaml += `    image: ${service.image}\n`
    
    if (service.container_name) {
      yaml += `    container_name: ${service.container_name}\n`
    }
    
    if (service.ports && service.ports.length > 0) {
      yaml += '    ports:\n'
      for (const port of service.ports) {
        yaml += `      - "${port}"\n`
      }
    }
    
    if (service.volumes && service.volumes.length > 0) {
      yaml += '    volumes:\n'
      for (const volume of service.volumes) {
        yaml += `      - "${volume}"\n`
      }
    }
    
    if (service.environment && service.environment.length > 0) {
      yaml += '    environment:\n'
      for (const env of service.environment) {
        yaml += `      - ${env}\n`
      }
    }
    
    if (service.restart) {
      yaml += `    restart: ${service.restart}\n`
    }
    
    if (service.network_mode) {
      yaml += `    network_mode: ${service.network_mode}\n`
    }
    
    if (service.working_dir) {
      yaml += `    working_dir: ${service.working_dir}\n`
    }
    
    if (service.user) {
      yaml += `    user: ${service.user}\n`
    }
    
    if (service.entrypoint) {
      if (Array.isArray(service.entrypoint)) {
        yaml += '    entrypoint:\n'
        for (const ep of service.entrypoint) {
          yaml += `      - ${ep}\n`
        }
      } else {
        yaml += `    entrypoint: ${service.entrypoint}\n`
      }
    }
    
    if (service.command) {
      if (Array.isArray(service.command)) {
        yaml += '    command:\n'
        for (const cmd of service.command) {
          yaml += `      - ${cmd}\n`
        }
      } else {
        yaml += `    command: ${service.command}\n`
      }
    }
    
    if (service.links && service.links.length > 0) {
      yaml += '    links:\n'
      for (const link of service.links) {
        yaml += `      - ${link}\n`
      }
    }
  }
  
  return yaml
}

export default function DockerRunToComposePage() {
  const t = useTranslations()

  const [input, setInput] = useState("docker run -d --name myapp -p 8080:80 -e NODE_ENV=production myimage:latest")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")

  const convertCommand = () => {
    if (!input.trim()) {
      setOutput("")
      setError("")
      return
    }

    try {
      const compose = parseDockerRunCommand(input)
      
      if (!compose) {
        setError(t("tools.docker-run-to-compose.invalid_command"))
        setOutput("")
        return
      }
      
      const yaml = generateYamlFromCompose(compose)
      setOutput(yaml)
      setError("")
    } catch (err) {
      console.error(err)
      setError(t("tools.docker-run-to-compose.conversion_failed"))
      setOutput("")
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
  }

  const downloadCompose = () => {
    if (output) {
      const blob = new Blob([output], { type: "text/yaml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "docker-compose.yml"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("tools.docker-run-to-compose.name")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("tools.docker-run-to-compose.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("tools.docker-run-to-compose.input_title")}</CardTitle>
            <CardDescription>
              {t("tools.docker-run-to-compose.input_desc")}
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
              placeholder={t("tools.docker-run-to-compose.input_placeholder")}
              className={getTextareaClasses('input', !error)}
            />

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            <div className="flex gap-2">
              <Button onClick={convertCommand} className="flex-1">
                {t("tools.docker-run-to-compose.convert_button")}
              </Button>
              <Button onClick={clearAll} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("tools.docker-run-to-compose.output_title")}</CardTitle>
            <CardDescription>
              {t("tools.docker-run-to-compose.output_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={output}
              readOnly
              placeholder={t("tools.docker-run-to-compose.output_placeholder")}
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
                onClick={downloadCompose}
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

      {/* SEO内容区域 */}
      <ToolSEOSection toolId="docker-run-to-compose" />
    </div>
  )
}

