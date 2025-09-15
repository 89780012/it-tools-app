import { getLocalizedChangelogData } from "@/lib/changelog-data";
import { Timeline } from "@/components/changelog/timeline";
import { useTranslations, useLocale } from "next-intl";
import { Clock, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ChangelogPage() {
  const t = useTranslations('changelog');
  const locale = useLocale();
  const localizedChangelogData = getLocalizedChangelogData(locale);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <GitBranch className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('title')}
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('description')}
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{t('lastUpdated')}: 2025-09-14</span>
          </div>
          <Badge variant="outline" className="font-mono">
            {localizedChangelogData[0].version}
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <Timeline data={localizedChangelogData} />
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t text-center">
        <p className="text-sm text-muted-foreground">
          {t('footer')}
        </p>
      </div>
    </div>
  );
}