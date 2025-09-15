"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalizedChangelogEntry } from "@/lib/changelog-data";
import {
  Calendar,
  GitCommit,
  Zap,
  Bug,
  Settings,
  Sparkles
} from "lucide-react";

interface TimelineProps {
  data: LocalizedChangelogEntry[];
}

interface TimelineItemProps {
  entry: LocalizedChangelogEntry;
  isLast: boolean;
}

interface VersionBadgeProps {
  type: 'major' | 'minor' | 'patch';
  version: string;
}

function getChangeTypeIcon(type: 'feat' | 'fix' | 'optimize' | 'refactor') {
  switch (type) {
    case 'feat':
      return <Sparkles className="h-4 w-4" />;
    case 'fix':
      return <Bug className="h-4 w-4" />;
    case 'optimize':
      return <Zap className="h-4 w-4" />;
    case 'refactor':
      return <Settings className="h-4 w-4" />;
    default:
      return <GitCommit className="h-4 w-4" />;
  }
}

function getChangeTypeColor(type: 'feat' | 'fix' | 'optimize' | 'refactor') {
  switch (type) {
    case 'feat':
      return 'text-green-600 dark:text-green-400';
    case 'fix':
      return 'text-red-600 dark:text-red-400';
    case 'optimize':
      return 'text-blue-600 dark:text-blue-400';
    case 'refactor':
      return 'text-purple-600 dark:text-purple-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

function VersionBadge({ type, version }: VersionBadgeProps) {
  const variants = {
    major: 'destructive',
    minor: 'default',
    patch: 'secondary'
  } as const;

  return (
    <Badge variant={variants[type]} className="font-mono text-xs">
      {version}
    </Badge>
  );
}

function TimelineItem({ entry, isLast }: TimelineItemProps) {
  return (
    <div className="relative flex gap-6 pb-8">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <GitCommit className="h-6 w-6" />
        </div>
        {!isLast && (
          <div className="mt-2 h-full w-px bg-border" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <VersionBadge type={entry.type} version={entry.version} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{entry.date}</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{entry.title}</CardTitle>
            <CardDescription>{entry.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entry.changes.map((change, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`mt-0.5 ${getChangeTypeColor(change.type)}`}>
                    {getChangeTypeIcon(change.type)}
                  </div>
                  <span className="text-sm leading-relaxed">
                    {change.description}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Timeline({ data }: TimelineProps) {
  return (
    <div className="space-y-0">
      {data.map((entry, index) => (
        <TimelineItem
          key={entry.version}
          entry={entry}
          isLast={index === data.length - 1}
        />
      ))}
    </div>
  );
}