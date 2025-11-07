import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, method, headers, data } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // 构建请求选项
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: headers || {},
    }

    // 如果有请求体且不是GET请求，添加body
    if (data && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = data
    }

    // 发起请求
    const response = await fetch(url, fetchOptions)
    
    // 获取响应内容
    const responseText = await response.text()
    
    // 获取响应头
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    // 返回响应
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText,
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { 
        error: 'Request failed',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}


