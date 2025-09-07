"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { AppSidebar } from "@/components/app-sidebar"
import { ToolContainer } from "@/components/tool-container"
import { useTranslations } from 'next-intl'
import { toolsConfig } from "@/lib/tools-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, Star, TrendingUp, Zap } from "lucide-react"

export default function Home() {
  const t = useTranslations()
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const popularTools = toolsConfig.flatMap(category => category.tools).slice(0, 6)

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar onToolSelect={setSelectedTool} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto">
          {selectedTool && selectedTool !== '' ? (
            <ToolContainer toolId={selectedTool} />
          ) : (
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
                    <CardTitle className="text-sm font-medium">{t("home.tools_total")}</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">50+</div>
                    <p className="text-xs text-muted-foreground">{t("home.continuously_adding")}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("home.tools_categories")}</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{toolsConfig.length}</div>
                    <p className="text-xs text-muted-foreground">{t("home.cover_main_scenarios")}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("home.update_frequency")}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{t("home.weekly")}</div>
                    <p className="text-xs text-muted-foreground">{t("home.new_tools_features")}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">{t("home.categories_title")}</h2>
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
                            ? t("home.tools_count", { count: category.tools.length })
                            : t("home.coming_soon")}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {popularTools.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">{t("home.popular_tools_title")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {popularTools.map((tool) => (
                      <Card key={tool.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                          <CardDescription>{tool.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-primary">{t("common.click_sidebar")}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-2xl font-bold mb-4">{t("home.features_title")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("home.modern_design")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {t("home.modern_design_desc")}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t("home.multilingual")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {t("home.multilingual_desc")}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t("home.high_performance")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {t("home.high_performance_desc")}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t("home.privacy_protection")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {t("home.privacy_protection_desc")}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            </div>
          </div>
          )}
        </main>
      </div>
    </div>
  )
}
