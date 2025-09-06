"use client"

import { Header } from "@/components/header"
import { AppSidebar } from "@/components/app-sidebar"
import { useI18n } from "@/i18n/context"
import { toolsConfig } from "@/lib/tools-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, Star, TrendingUp, Zap } from "lucide-react"

export default function Home() {
  const { t } = useI18n()

  const popularTools = toolsConfig.flatMap(category => category.tools).slice(0, 6)

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <Wrench className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-4xl font-bold">{t("header.title")}</h1>
                  <p className="text-xl text-muted-foreground mt-2">{t("header.subtitle")}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">工具总数</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">50+</div>
                    <p className="text-xs text-muted-foreground">持续添加中</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">工具分类</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{toolsConfig.length}</div>
                    <p className="text-xs text-muted-foreground">覆盖主要场景</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">更新频率</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">每周</div>
                    <p className="text-xs text-muted-foreground">新工具和功能</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">工具分类</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {toolsConfig.map((category) => (
                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{category.name}</span>
                        </CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {category.tools.length > 0 
                            ? `${category.tools.length} 个工具` 
                            : "即将推出"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {popularTools.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">热门工具</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {popularTools.map((tool) => (
                      <Card key={tool.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                          <CardDescription>{tool.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-primary">点击左侧菜单使用</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-2xl font-bold mb-4">功能特点</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>🎨 现代化设计</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        基于 shadcn/ui 构建，支持亮色/暗色主题切换，提供优雅的用户体验
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>🌐 多语言支持</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        支持中文和英文界面，满足不同用户的语言偏好
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>⚡ 高性能</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        基于 Next.js 和 TypeScript，提供快速响应的用户体验
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>🔒 隐私保护</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        所有工具都在客户端运行，确保您的数据隐私和安全
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
