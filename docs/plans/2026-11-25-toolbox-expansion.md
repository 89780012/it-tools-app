# Developer Toolbox Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver every tool and enhancement from the accepted analysis with 12 languages, meaningful unit tests, browser interaction validation, and one final review.

**Architecture:** Keep React/Vite client tools and the existing Go proxy. Independent tool pages reuse a shared accessible workbench; pure algorithms live in src/lib. Additional locale catalogs are merged into the existing translation context and prerender dictionaries, preserving existing translations and URLs.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind/shadcn, Vitest/Testing Library, Go, Playwright browser checks; maintained parsing/formatting libraries for SQL, JSONPath, JSON Schema, Markdown, CSS and certificates.

---

## Scope and ownership

1. Core infrastructure (parent): src/components/tools/workbench.tsx; translation additions loader; catalog/categories/sidebar; SEO/sitemaps; home favorites/recent history; integration and end-to-end verification.
2. Developer tools: regex-tester, jwt-decoder, text-diff, json-to-types. Own pages/components/lib/tests and src/i18n/messages/developer-additions/{locale}.json only.
3. Text/data tools: sql-formatter, text-batch-processor, string-escape, jsonpath-query. Own pages/components/lib/tests and src/i18n/messages/text-additions/{locale}.json only.
4. Configuration/network tools: json-schema-validator, url-parser, yaml-formatter, xml-formatter, subnet-calculator, number-base-converter, certificate-parser. Own pages/components/lib/tests and src/i18n/messages/network-additions/{locale}.json only.
5. Frontend tools: markdown-preview, image-compressor, css-formatter, color-contrast-checker. Own pages/components/lib/tests and src/i18n/messages/frontend-additions/{locale}.json only.
6. Existing enhancements: time converter (seconds, milliseconds, ISO, zones, difference), cURL request editor/headers/timing/templates, seeded mock generator with constraints/Chinese/boundary/null data. Own these components/utilities/tests and src/i18n/messages/enhancement-additions/{locale}.json only.
Total: 19 new pages (8 primary tools, 9 secondary pages with YAML/XML separate, CSS and contrast) plus enhancements; 63 tools, 12 categories, 780 prerendered pages. Registry remains authoritative; final test must compare actual registered IDs with required scope.
Total: 19 new pages (8 primary, 8 secondary with YAML/XML separate, CSS and contrast included) plus enhancements. Registry remains authoritative; final test must compare actual registered IDs with required scope.

## Execution steps

- Inspect current routes, i18n, SEO, tests and available runtimes; confirm clean baseline.
- Add workbench shell, localized field/output/actions, safe clipboard/download and catalog translation loader. Verify SSR-safe rendering.
- Install parsing dependencies once. Implement independent groups without shared-file edits. Each group writes 12 complete locale catalogs with tools metadata and labels, pure function tests, UI tests, and deterministic browser cases.
- Integrate all tools into existing category IDs where appropriate; add API/code/frontend categories, move color and text encodings to suitable groups, preserve all existing routes.
- Implement favorites and recent tools using validated localStorage metadata only; add accessible filter buttons, favorite labels and localization. No persisted tool input by default.
- Use merged locale catalogs in client, SSR and SEO generation. Generate new sitemap entries, preserve canonical behavior of existing routes. Add completeness and interpolation tests across 12 languages.
- Run npm run test:run, npm run lint, npm run test:api and npm run build. Fix failures before proceeding.
- Start Vite/Go services and browser test runner. Exercise all new tools and all enhancements with positive/negative cases; smoke/operate existing 44 pages; check languages, RTL, responsive layout, theme, clipboard/download/file workflows where supported. Store machine-readable verification report and screenshots.
- One final read-only code review. Resolve concrete defects, retest affected paths, update docs with exact tool/page counts and completed evidence.

## Acceptance

- All required routes exist, listed once, load without runtime errors and support 12 locales without raw translation keys.
- Each nontrivial algorithm has meaningful normal, edge and invalid input tests; UI tests verify state/output/error transitions.
- Regex work is interruptible; previews sanitize untrusted markup; client tools never evaluate arbitrary user code.
- Browser checks exercise visible controls and assert actual output, not only route text.
- Build prerenders every catalog route in 12 locales, with valid localized metadata; Go API tests pass.
- Final report distinguishes verified behavior from environment limitations; do not claim full checks when any fail.
