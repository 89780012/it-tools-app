import { NextRequest, NextResponse } from "next/server"

// 从环境变量读取 API 配置
// const API_URL = process.env.I18N_TRANSLATE_API_URL
// const API_KEY = process.env.I18N_TRANSLATE_API_KEY
// const API_MODEL = process.env.I18N_TRANSLATE_API_MODEL

const API_URL = "https://oapi.uk/v1/chat/completions"
const API_KEY = "sk-2BzjTiDatY1C9bL9JiEQxDzaiRSWgVlJ6qlYozNnZw4TNwmS"
const API_MODEL = "gpt-5-nano"


// 语言代码映射到完整语言名称
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  zh: "简体中文",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
  hi: "हिन्दी",
}

export async function POST(request: NextRequest) {
  try {
    // 检查环境变量是否配置
    if (!API_URL || !API_KEY || !API_MODEL) {
      return NextResponse.json(
        { error: "Language detection API configuration is missing" },
        { status: 500 }
      )
    }

    const { samples, fileName } = await request.json()

    if (!samples || !Array.isArray(samples) || samples.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload: samples array is required" },
        { status: 400 }
      )
    }

    // 构建语种检测提示词
    const systemPrompt = `You are a language detection expert. Analyze the provided text samples and determine the language.
Return ONLY a valid JSON object with this exact format:
{
  "language": "<ISO 639-1 code>",
  "confidence": <0-1>,
  "languageName": "<Full language name>"
}

Supported languages and their codes:
- zh: 简体中文
- en: English
- de: Deutsch
- ja: 日本語
- ko: 한국어
- es: Español
- fr: Français
- hi: हिन्दी
- ar: العربية
- pt: Português
- ru: Русский
- it: Italiano

Rules:
1. Analyze the linguistic patterns, characters, and vocabulary
2. Return confidence as a decimal between 0 and 1 (e.g., 0.95)
3. If uncertain, return the most likely language with lower confidence
4. Use the file name as a hint if provided
5. Do not add any explanations, only return the JSON object`

    const samplesText = samples.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')
    const fileNameHint = fileName ? `\n\nFile name hint: ${fileName}` : ''

    const userPrompt = `Analyze these text samples and return the language detection result:\n\n${samplesText}${fileNameHint}`

    // 调用大模型 API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: errorData?.error?.message || "Language detection service error",
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: "No detection result received" },
        { status: 500 }
      )
    }

    // 解析大模型返回的 JSON
    let result: { language: string; confidence: number; languageName: string }
    try {
      result = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: "Failed to parse language detection response" },
        { status: 500 }
      )
    }

    // 验证返回格式
    if (!result.language || typeof result.confidence !== 'number') {
      return NextResponse.json(
        { error: "Invalid detection result format" },
        { status: 500 }
      )
    }

    // 确保 confidence 在 0-1 范围内
    result.confidence = Math.max(0, Math.min(1, result.confidence))

    // 如果 languageName 缺失,使用映射表补充
    if (!result.languageName && LANGUAGE_NAMES[result.language]) {
      result.languageName = LANGUAGE_NAMES[result.language]
    }

    return NextResponse.json({
      language: result.language,
      confidence: result.confidence,
      languageName: result.languageName || result.language
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Language detection request failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
