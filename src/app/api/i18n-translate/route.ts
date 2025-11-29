import { NextRequest, NextResponse } from "next/server"

// 从环境变量读取 API 配置
const API_URL = process.env.I18N_TRANSLATE_API_URL
const API_KEY = process.env.I18N_TRANSLATE_API_KEY
const API_MODEL = process.env.I18N_TRANSLATE_API_MODEL

// const API_URL = "https://oapi.uk/v1/chat/completions"
// const API_KEY = "sk-2BzjTiDatY1C9bL9JiEQxDzaiRSWgVlJ6qlYozNnZw4TNwmS"
// const API_MODEL = "gpt-5-nano"


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
        { error: "Translation API configuration is missing" },
        { status: 500 }
      )
    }

    const { sourceLanguage, targetLanguage, entries, options } =
      await request.json()

    if (!sourceLanguage || !targetLanguage || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      )
    }

    if (entries.length === 0) {
      return NextResponse.json({ translations: {} })
    }

    // 构建翻译提示词
    const sourceLangName = LANGUAGE_NAMES[sourceLanguage] || sourceLanguage
    const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage

    // 构建要翻译的条目列表
    const entriesText = entries
      .map((entry: { key: string; value: string }, index: number) => {
        const keyHint = options?.includeKeys ? ` (key: ${entry.key})` : ""
        return `${index + 1}. ${entry.value}${keyHint}`
      })
      .join("\n")

    const systemPrompt = `You are a professional translator. Translate the following text entries from ${sourceLangName} to ${targetLangName}. 

Important rules:
1. Return ONLY a valid JSON object with the format: {"1": "translated text 1", "2": "translated text 2", ...}
2. The keys should be the entry numbers (1, 2, 3, etc.)
3. Preserve placeholders like {name}, {count}, {{variable}} exactly as they appear
4. Maintain the same tone and style as the original text
5. Do not add any explanations or comments, only return the JSON object`

    const userPrompt = `Please translate the following ${entries.length} entries from ${sourceLangName} to ${targetLangName}:\n\n${entriesText}\n\nReturn the translations as a JSON object with entry numbers as keys.`

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
          error:
            errorData?.error?.message ||
            errorData?.message ||
            "Translation service error",
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: "No translation content received" },
        { status: 500 }
      )
    }

    // 解析大模型返回的 JSON
    let translationsObj: Record<string, string>
    try {
      translationsObj = JSON.parse(content)
    } catch {
      return NextResponse.json(
        { error: "Failed to parse translation response" },
        { status: 500 }
      )
    }

    // 将数字键转换为原始路径键
    const result: Record<string, string> = {}
    entries.forEach((entry: { key: string; value: string }, index: number) => {
      const translationKey = String(index + 1)
      if (translationsObj[translationKey]) {
        result[entry.key] = translationsObj[translationKey]
      } else {
        // 如果找不到翻译，使用原文
        result[entry.key] = entry.value
      }
    })

    return NextResponse.json({ translations: result })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Translator request failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
