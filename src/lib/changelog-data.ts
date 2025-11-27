import type { Locale } from '@/i18n/config';

interface LocalizedText extends Partial<Record<Locale, string>> {
  zh: string;
  en: string;
  hi: string;
  de: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: LocalizedText;
  description: LocalizedText;
  changes: {
    type: 'feat' | 'fix' | 'optimize' | 'refactor';
    description: LocalizedText;
  }[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: "v1.0.0",
    date: "2025-12-05",
    type: "major",
    title: {
      zh: "1.0.0 国际化升级与 i18n 翻译器",
      en: "Internationalization Expansion with i18n Translator",
      hi: "i18n अनुवादक के साथ अंतर्राष्ट्रीयकरण विस्तार",
      de: "Internationalisierungsausbau mit i18n-Übersetzer",
      es: "Expansión de internacionalización con traductor i18n",
      fr: "Extension de l'internationalisation avec traducteur i18n",
      it: "Espansione dell'internazionalizzazione con traduttore i18n",
      pt: "Expansão da internacionalização com tradutor i18n",
      ru: "Расширение интернационализации с переводчиком i18n",
      ja: "i18n翻訳ツールによる国際化の拡張",
      ko: "i18n 번역기와 함께하는 국제화 확장",
      ar: "توسيع التعريب مع مترجم i18n"
    },
    description: {
      zh: "上线 i18n 翻译器、补全 12 种语言文案并统一共享副本。",
      en: "Launched the i18n translator, expanded coverage across 12 locales and harmonized shared copy.",
      hi: "i18n ट्रांसलेटर शुरू किया गया, 12 भाषाओं में कवरेज बढ़ाई और साझा शब्दावली को एकरूप किया गया।",
      de: "Den i18n-Übersetzer eingeführt, 12 Sprachen abgedeckt und gemeinsame Texte vereinheitlicht.",
      es: "Lanzamos el traductor i18n, ampliamos 12 idiomas y unificamos los textos compartidos.",
      fr: "Lancement du traducteur i18n, extension à 12 langues et harmonisation des textes partagés.",
      it: "Lanciato il traduttore i18n, esteso a 12 lingue e unificati i testi condivisi.",
      pt: "Lançamos o tradutor i18n, ampliamos para 12 idiomas e unificamos os textos compartilhados.",
      ru: "Запущен переводчик i18n, расширена поддержка до 12 языков и унифицирован общий текст.",
      ja: "i18n翻訳ツールを公開し、12言語を網羅して共通文言を統一しました。",
      ko: "i18n 번역기를 선보이고 12개 언어를 포함하여 공통 문구를 통합했습니다.",
      ar: "أطلقنا مترجم i18n، ووسعنا التغطية إلى 12 لغة ووحدنا النصوص المشتركة."
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "新增 i18n 翻译器工具，使团队可在工具区域内预览并发布各语言文案。",
          en: "Added the i18n translator tool so the team can preview and publish locale-specific copy without leaving the tools workspace.",
          hi: "i18n ट्रांसलेटर टूल जोड़ा गया ताकि टीम टूल्स कार्यक्षेत्र में रहकर स्थानीय सामग्री को पूर्वावलोकन और प्रकाशित कर सके।",
          de: "Neues i18n-Übersetzer-Tool hinzugefügt, damit das Team locale-spezifische Texte direkt aus dem Tool-Arbeitsbereich prüfen und veröffentlichen kann.",
          es: "Añadimos la herramienta traductor i18n para que el equipo pueda previsualizar y publicar textos por idioma desde el espacio de herramientas.",
          fr: "Ajouté l'outil traducteur i18n afin que l'équipe puisse prévisualiser et publier les textes par langue depuis l'espace outils.",
          it: "Aggiunto lo strumento traduttore i18n per permettere al team di visualizzare e pubblicare i testi localizzati direttamente dall'area strumenti.",
          pt: "Adicionada a ferramenta tradutor i18n para que a equipe possa visualizar e publicar textos específicos de cada localidade sem sair do espaço de ferramentas.",
          ru: "Добавлен инструмент переводчика i18n, чтобы команда могла просматривать и публиковать локализованные тексты не покидая рабочую область инструментов.",
          ja: "ツール領域を離れずにロケール別の文言をプレビュー・公開できる i18n 翻訳ツールを追加しました。",
          ko: "도구 영역에서 벗어나지 않고 로케일별 문구를 미리보고 배포할 수 있는 i18n 번역기 도구를 추가했습니다.",
          ar: "أضفنا أداة مترجم i18n حتى يتمكن الفريق من معاينة ونشر المحتوى حسب اللغة دون مغادرة مساحة الأدوات."
        }
      },
      {
        type: "feat",
        description: {
          zh: "将所有工具的 metadata/alternates 扩展至 12 个语言，并刷新 sitemap 链接。",
          en: "Expanded tool metadata/alternates to 12 locales and refreshed sitemap references.",
          hi: "सभी टूल मेटाडेटा/alternates को 12 लोकल तक बढ़ाया और साइटमैप संदर्भों को ताज़ा किया।",
          de: "Tool-Metadaten/Alternates auf 12 Locales ausgeweitet und Sitemap-Verweise erneuert.",
          es: "Ampliamos los metadatos/alternates de las herramientas a 12 idiomas y actualizamos los enlaces del sitemap.",
          fr: "Élargi les métadonnées/alternates des outils à 12 langues et actualisé les références du sitemap.",
          it: "Estesi i metadati/alternates degli strumenti a 12 lingue supportate e aggiornati i riferimenti della sitemap.",
          pt: "Expandimos os metadados/alternates das ferramentas para 12 idiomas e atualizamos os links do sitemap.",
          ru: "Метаданные/альтернативы всех инструментов расширены до 12 локалей и обновлены ссылки карты сайта.",
          ja: "すべてのツールのメタデータ/alternatesを12のロケールに拡張し、サイトマップ参照を更新しました。",
          ko: "모든 도구의 메타데이터/alternates를 12개 로케일까지 확대하고 사이트맵 참조를 갱신했습니다.",
          ar: "وسّعنا بيانات التعريف/البدائل لجميع الأدوات لتشمل 12 لغة ودعونا الروابط في خريطة الموقع."
        }
      },
      {
        type: "optimize",
        description: {
          zh: "记录 changelog 回退规则，确保翻译器发布在各语言中突出展现。",
          en: "Documented changelog fallbacks so the translator release is highlighted across locales.",
          hi: "चैन्ज़लॉग फॉलबैक दस्तावेज़ित किए ताकि अनुवादक रिलीज़ सभी भाषाओं में उभर कर आए।",
          de: "Changelog-Fallbacks dokumentiert, damit der Übersetzer-Release in allen Locales hervorgehoben wird.",
          es: "Documentamos los fallback del changelog para resaltar el lanzamiento del traductor en todos los idiomas.",
          fr: "Documenté les fallback du changelog pour mettre en lumière la sortie du traducteur dans chaque langue.",
          it: "Documentati i fallback del changelog per evidenziare il rilascio del traduttore su ogni lingua.",
          pt: "Documentamos os fallback do changelog para destacar o lançamento do tradutor em todos os idiomas.",
          ru: "Задокументировали откаты changelog, чтобы релиз переводчика выделялся во всех локалях.",
          ja: "すべての言語で翻訳ツールのリリースが目立つように、changelog のフォールバックを記録しました。",
          ko: "모든 로케일에서 번역기 릴리스가 돋보이도록 변경 로그 폴백을 기록했습니다.",
          ar: "وثقنا خيارات التراجع في سجل التغييرات لإبراز إصدار المترجم في كل اللغات."
        }
      }
    ]
  },
  {
    version: "v0.9.0",
    date: "2025-11-22",
    type: "minor",
    title: {
      zh: "TOML 支持与加解密修复",
      en: "TOML Support and Crypto Fixes",
      hi: "TOML सपोर्ट और एन्क्रिप्शन सुधार",
      de: "TOML-Unterstützung und Krypto-Korrekturen"
    },
    description: {
      zh: "新增 JSON/YAML ⇄ TOML 转换与示例，修复 RSA 加解密与统计相关问题",
      en: "Added JSON/YAML ⇄ TOML conversions and examples, fixed RSA encrypt/decrypt and analytics related issues",
      hi: "JSON/YAML ⇄ TOML रूपांतरण और उदाहरण जोड़े गए, RSA एन्क्रिप्ट/डिक्रिप्ट और एनालिटिक्स से जुड़ी समस्याएँ ठीक की गईं",
      de: "JSON/YAML ⇄ TOML-Konvertierungen und Beispiele hinzugefügt, RSA-Verschlüsselung/Entschlüsselung und Analyse-Probleme behoben"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "新增 JSON → TOML / YAML → TOML / TOML → YAML 等格式转换能力，并补充使用示例，方便理解配置文件转换场景",
          en: "Added JSON → TOML / YAML → TOML / TOML → YAML format conversions with usage examples to better demonstrate config file conversion scenarios",
          hi: "JSON → TOML / YAML → TOML / TOML → YAML फॉर्मेट रूपांतरण जोड़े गए, कॉन्फ़िग फाइल रूपांतरण परिदृश्यों को बेहतर ढंग से दिखाने के लिए उपयोग उदाहरण जोड़े गए",
          de: "JSON → TOML / YAML → TOML / TOML → YAML Formatkonvertierungen mit Nutzungsbeispielen hinzugefügt, um Konfigurationsdatei-Konvertierungsszenarien besser zu demonstrieren"
        }
      },
      {
        type: "fix",
        description: {
          zh: "修复 RSA 加解密实现问题，使用浏览器 WebCrypto 提供真实 RSA 密钥对和加解密流程",
          en: "Fixed RSA encrypt/decrypt implementation by using browser WebCrypto to provide real RSA key pair generation and encryption/decryption flow",
          hi: "RSA एन्क्रिप्ट/डिक्रिप्ट इम्प्लीमेंटेशन को ठीक किया गया, ब्राउज़र WebCrypto के जरिए वास्तविक RSA की-पेयर जनरेशन और एन्क्रिप्शन/डिक्रिप्शन फ्लो उपयोग किया गया",
          de: "RSA-Verschlüsselung/Entschlüsselung-Implementierung korrigiert durch Verwendung des Browser-WebCrypto für echte RSA-Schlüsselpaar-Generierung und Verschlüsselungs-/Entschlüsselungsablauf"
        }
      },
      {
        type: "fix",
        description: {
          zh: "处理 Vercel 统计相关问题，避免无用统计代码引入和潜在告警",
          en: "Handled Vercel analytics related issues to avoid unnecessary analytics code and potential warnings",
          hi: "Vercel एनालिटिक्स से जुड़ी समस्याएँ हल की गईं, अनावश्यक एनालिटिक्स कोड और संभावित चेतावनियों से बचने के लिए",
          de: "Vercel-Analyse-bezogene Probleme behoben, um unnötigen Analyse-Code und potenzielle Warnungen zu vermeiden"
        }
      }
    ]
  },
  {
    version: "v0.8.0",
    date: "2025-10-12",
    type: "minor",
    title: {
      zh: "开发工具与图像处理扩展",
      en: "Developer Tools and Image Processing Expansion",
      hi: "डेवलपर टूल्स और इमेज प्रोसेसिंग विस्तार",
      de: "Entwickler-Tools und Bildverarbeitungs-Erweiterung"
    },
    description: {
      zh: "新增cURL转换器、图标设计器和图片转点阵图工具，丰富开发者工具和图像处理功能",
      en: "Added cURL converter, icon designer and image-to-dot-matrix tools, enriching developer tools and image processing capabilities",
      hi: "cURL कनवर्टर, आइकन डिज़ाइनर और इमेज-टू-डॉट-मैट्रिक्स टूल जोड़े गए, डेवलपर टूल्स और इमेज प्रोसेसिंग क्षमताओं में वृद्धि",
      de: "cURL-Konverter, Icon-Designer und Bild-zu-Punktmatrix-Tools hinzugefügt, um Entwickler-Tools und Bildverarbeitungsfunktionen zu erweitern"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "新增cURL转换器：支持将cURL命令转换为JavaScript(Fetch)、Node.js(Axios)、Python(Requests)、PHP和Go等多种语言代码，并提供在线测试功能",
          en: "Added cURL converter: converts cURL commands to multiple languages including JavaScript(Fetch), Node.js(Axios), Python(Requests), PHP, and Go, with online testing feature",
          hi: "cURL कनवर्टर जोड़ा गया: cURL कमांड को JavaScript(Fetch), Node.js(Axios), Python(Requests), PHP, और Go सहित कई भाषाओं में परिवर्तित करता है, ऑनलाइन टेस्टिंग सुविधा के साथ",
          de: "cURL-Konverter hinzugefügt: konvertiert cURL-Befehle in mehrere Sprachen einschließlich JavaScript(Fetch), Node.js(Axios), Python(Requests), PHP und Go, mit Online-Testfunktion"
        }
      },
      {
        type: "feat",
        description: {
          zh: "新增图标设计器：支持创建1-3个字符的文字图标，提供方形、圆形、圆角和超椭圆等形状，可导出SVG、PNG和ICO多种格式，支持7种标准尺寸(16px-1024px)批量导出",
          en: "Added icon designer: create text-based icons with 1-3 characters, supports square, circle, rounded and squircle shapes, exports to SVG, PNG and ICO formats, batch export in 7 standard sizes (16px-1024px)",
          hi: "आइकन डिज़ाइनर जोड़ा गया: 1-3 अक्षरों के साथ टेक्स्ट-आधारित आइकन बनाएं, स्क्वायर, सर्कल, राउंडेड और स्क्विर्कल आकृतियों का समर्थन करता है, SVG, PNG और ICO फॉर्मेट में निर्यात, 7 मानक आकारों (16px-1024px) में बैच निर्यात",
          de: "Icon-Designer hinzugefügt: Erstellen Sie textbasierte Icons mit 1-3 Zeichen, unterstützt quadratische, runde, abgerundete und Squircle-Formen, exportiert in SVG-, PNG- und ICO-Formate, Batch-Export in 7 Standardgrößen (16px-1024px)"
        }
      },
      {
        type: "feat",
        description: {
          zh: "新增图片转点阵图工具：将图片或文字转换为艺术点阵图，支持圆形、方形、菱形和六边形点，提供灰度、黑白和彩色三种模式，可自定义点大小、间距和背景，导出PNG和SVG格式",
          en: "Added image-to-dot-matrix tool: converts images or text to artistic dot matrix, supports circle, square, diamond and hexagon dots, offers grayscale, black&white and color modes, customizable dot size, spacing and background, exports to PNG and SVG",
          hi: "इमेज-टू-डॉट-मैट्रिक्स टूल जोड़ा गया: छवियों या टेक्स्ट को कलात्मक डॉट मैट्रिक्स में परिवर्तित करता है, सर्कल, स्क्वायर, डायमंड और हेक्सागन डॉट्स का समर्थन करता है, ग्रेस्केल, ब्लैक एंड व्हाइट और कलर मोड प्रदान करता है, अनुकूलन योग्य डॉट आकार, स्पेसिंग और पृष्ठभूमि, PNG और SVG में निर्यात",
          de: "Bild-zu-Punktmatrix-Tool hinzugefügt: konvertiert Bilder oder Text in künstlerische Punktmatrix, unterstützt Kreis-, Quadrat-, Rauten- und Sechseckpunkte, bietet Graustufen-, Schwarz-Weiß- und Farbmodi, anpassbare Punktgröße, Abstand und Hintergrund, exportiert in PNG und SVG"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "cURL转换器集成代理API功能，解决跨域问题，支持在线测试API请求并实时查看响应结果",
          en: "cURL converter integrates proxy API to solve CORS issues, supports online API request testing with real-time response viewing",
          hi: "cURL कनवर्टर CORS समस्याओं को हल करने के लिए प्रॉक्सी API को एकीकृत करता है, वास्तविक समय प्रतिक्रिया देखने के साथ ऑनलाइन API अनुरोध परीक्षण का समर्थन करता है",
          de: "cURL-Konverter integriert Proxy-API zur Lösung von CORS-Problemen, unterstützt Online-API-Anforderungstests mit Echtzeit-Antwortansicht"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "图标设计器支持预设颜色方案和随机配色，提供8种预设颜色组合和全屏预览功能，优化大尺寸图标的预览体验",
          en: "Icon designer supports preset color schemes and random colors, provides 8 preset color combinations and fullscreen preview, optimized preview experience for large icons",
          hi: "आइकन डिज़ाइनर प्रीसेट कलर स्कीम और रैंडम रंगों का समर्थन करता है, 8 प्रीसेट कलर कॉम्बिनेशन और फुलस्क्रीन प्रीव्यू प्रदान करता है, बड़े आइकनों के लिए अनुकूलित प्रीव्यू अनुभव",
          de: "Icon-Designer unterstützt voreingestellte Farbschemata und Zufallsfarben, bietet 8 voreingestellte Farbkombinationen und Vollbildvorschau, optimierte Vorschau-Erfahrung für große Icons"
        }
      },
      {
        type: "feat",
        description: {
          zh: "图片转点阵图工具支持图片和文字两种输入模式，文字模式可自定义字体大小、粗细和字体类型",
          en: "Image-to-dot-matrix tool supports both image and text input modes, text mode allows customization of font size, weight and font family",
          hi: "इमेज-टू-डॉट-मैट्रिक्स टूल छवि और टेक्स्ट दोनों इनपुट मोड का समर्थन करता है, टेक्स्ट मोड फ़ॉन्ट आकार, वजन और फ़ॉन्ट परिवार के अनुकूलन की अनुमति देता है",
          de: "Bild-zu-Punktmatrix-Tool unterstützt sowohl Bild- als auch Texteingabemodi, Textmodus ermöglicht Anpassung von Schriftgröße, Schriftstärke und Schriftfamilie"
        }
      }
    ]
  },
  {
    version: "v0.7.0",
    date: "2025-10-10",
    type: "minor",
    title: {
      zh: "工具扩展与分类优化",
      en: "Tool Expansion and Category Optimization",
      hi: "टूल विस्तार और श्रेणी अनुकूलन",
      de: "Tool-Erweiterung und Kategorieoptimierung"
    },
    description: {
      zh: "新增UUID生成器，重构格式转换工具为双向转换，优化工具分类结构",
      en: "Added UUID generator, refactored format conversion tools to bidirectional conversion, optimized tool category structure",
      hi: "UUID जेनरेटर जोड़ा गया, द्विदिश रूपांतरण के लिए फॉर्मेट कनवर्शन टूल को रिफैक्टर किया गया, टूल श्रेणी संरचना का अनुकूलन",
      de: "UUID-Generator hinzugefügt, Formatkonvertierungstools zu bidirektionaler Konvertierung umstrukturiert, Tool-Kategoriestruktur optimiert"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "新增UUID生成器：支持批量生成1-1000个UUID，提供多种输出格式（标准、大写、无横杠等）",
          en: "Added UUID generator: supports batch generation of 1-1000 UUIDs with multiple output formats (standard, uppercase, no-dash, etc.)",
          hi: "UUID जेनरेटर जोड़ा गया: कई आउटपुट फॉर्मेट (स्टैंडर्ड, अपरकेस, नो-डैश आदि) के साथ 1-1000 UUID की बैच जेनरेशन का समर्थन",
          de: "UUID-Generator hinzugefügt: unterstützt Batch-Generierung von 1-1000 UUIDs mit mehreren Ausgabeformaten (Standard, Großbuchstaben, ohne Bindestriche usw.)"
        }
      },
      {
        type: "feat",
        description: {
          zh: "创建生成器工具分类：将UUID生成器和密码生成器归类到独立分类，优化工具组织结构",
          en: "Created 'Generator Tools' category: organized UUID generator and password generator into independent category, optimized tool structure",
          hi: "'जेनरेटर टूल्स' श्रेणी बनाई गई: UUID जेनरेटर और पासवर्ड जेनरेटर को स्वतंत्र श्रेणी में व्यवस्थित किया गया, टूल संरचना का अनुकूलन",
          de: "'Generator-Tools'-Kategorie erstellt: UUID-Generator und Passwort-Generator in unabhängige Kategorie organisiert, Tool-Struktur optimiert"
        }
      },
      {
        type: "refactor",
        description: {
          zh: "格式转换工具双向转换升级：JSON⇄CSV、JSON⇄YAML、JSON⇄XML，支持一键切换转换方向",
          en: "Format conversion tools upgraded to bidirectional conversion: JSON⇄CSV, JSON⇄YAML, JSON⇄XML with one-click direction switching",
          hi: "फॉर्मेट कनवर्शन टूल को द्विदिश रूपांतरण में अपग्रेड किया गया: JSON⇄CSV, JSON⇄YAML, JSON⇄XML वन-क्लिक दिशा स्विचिंग के साथ",
          de: "Formatkonvertierungstools auf bidirektionale Konvertierung aktualisiert: JSON⇄CSV, JSON⇄YAML, JSON⇄XML mit Ein-Klick-Richtungswechsel"
        }
      },
      {
        type: "feat",
        description: {
          zh: "CSV转JSON功能：智能解析CSV数据，支持嵌套对象反扁平化和数据类型识别",
          en: "CSV to JSON conversion: intelligent CSV parsing with nested object unflatten and data type recognition",
          hi: "CSV से JSON रूपांतरण: नेस्टेड ऑब्जेक्ट अनफ्लैटन और डेटा प्रकार पहचान के साथ बुद्धिमान CSV पार्सिंग",
          de: "CSV-zu-JSON-Konvertierung: intelligente CSV-Analyse mit verschachtelter Objekt-Entfaltung und Datentypenerkennung"
        }
      },
      {
        type: "feat",
        description: {
          zh: "YAML转JSON和XML转JSON功能：完整实现双向数据格式转换能力",
          en: "YAML to JSON and XML to JSON conversion: fully implemented bidirectional data format conversion",
          hi: "YAML से JSON और XML से JSON रूपांतरण: पूरी तरह से द्विदिश डेटा फॉर्मेट रूपांतरण लागू किया गया",
          de: "YAML-zu-JSON- und XML-zu-JSON-Konvertierung: vollständig implementierte bidirektionale Datenformatkonvertierung"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "更新工具分类描述：将转换器重命名为格式转换器，突出双向转换特性",
          en: "Updated tool category description: renamed 'Converters' to 'Format Converters', highlighting bidirectional conversion features",
          hi: "टूल श्रेणी विवरण अपडेट किया गया: 'कन्वर्टर्स' का नाम बदलकर 'फॉर्मेट कन्वर्टर्स' किया गया, द्विदिश रूपांतरण सुविधाओं को उजागर किया गया",
          de: "Tool-Kategoriebeschreibung aktualisiert: 'Konverter' in 'Formatkonverter' umbenannt, bidirektionale Konvertierungsfunktionen hervorgehoben"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "完善相关工具推荐系统：在related-tools组件中添加新工具支持",
          en: "Improved related tools recommendation system: added new tool support in related-tools component",
          hi: "संबंधित टूल्स अनुशंसा प्रणाली में सुधार: related-tools कॉम्पोनेंट में नए टूल समर्थन जोड़ा गया",
          de: "Verbessertes verwandte-Tools-Empfehlungssystem: neue Tool-Unterstützung in related-tools-Komponente hinzugefügt"
        }
      },
      {
        type: "fix",
        description: {
          zh: "代码质量优化：修复所有ESLint警告和错误，移除未使用变量，改进类型定义",
          en: "Code quality optimization: fixed all ESLint warnings and errors, removed unused variables, improved type definitions",
          hi: "कोड गुणवत्ता अनुकूलन: सभी ESLint चेतावनियाँ और त्रुटियाँ ठीक की गईं, अप्रयुक्त वैरिएबल हटाए गए, प्रकार परिभाषाओं में सुधार",
          de: "Code-Qualitätsoptimierung: alle ESLint-Warnungen und -Fehler behoben, ungenutzte Variablen entfernt, Typdefinitionen verbessert"
        }
      }
    ]
  },
  {
    version: "v0.6.0",
    date: "2025-09-27",
    type: "minor",
    title: {
      zh: "用户体验优化升级",
      en: "User Experience Optimization Upgrade",
      hi: "उपयोगकर्ता अनुभव अनुकूलन अपग्रेड",
      de: "Benutzererfahrungs-Optimierungs-Upgrade"
    },
    description: {
      zh: "全面优化工具页面 textarea 组件，提升响应式体验和交互一致性",
      en: "Comprehensive optimization of tool page textarea components, improving responsive experience and interaction consistency",
      hi: "टूल पेज टेक्स्टएरिया कॉम्पोनेंट्स का व्यापक अनुकूलन, रिस्पॉन्सिव अनुभव और इंटरैक्शन स्थिरता में सुधार",
      de: "Umfassende Optimierung der Textarea-Komponenten auf Tool-Seiten, Verbesserung der responsiven Erfahrung und Interaktionskonsistenz"
    },
    changes: [
      {
        type: "optimize",
        description: {
          zh: "统一 textarea 组件高度限制：移动端和桌面端均为 300px 最大高度",
          en: "Unified textarea component height limits: 300px maximum height for both mobile and desktop",
          hi: "एकीकृत टेक्स्टएरिया घटक ऊंचाई सीमा: मोबाइल और डेस्कटॉप दोनों के लिए 300px अधिकतम ऊंचाई",
          de: "Einheitliche Textarea-Komponenten-Höhenbegrenzungen: 300px maximale Höhe für Mobil- und Desktop-Geräte"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "添加响应式滚动条和禁用手动拖拽调整，改善用户交互体验",
          en: "Added responsive scrollbars and disabled manual drag resize to improve user interaction experience",
          hi: "उपयोगकर्ता इंटरैक्शन अनुभव में सुधार के लिए रिस्पॉन्सिव स्क्रॉलबार जोड़े गए और मैन्युअल ड्रैग रीसाइज़ को अक्षम किया गया",
          de: "Responsive Scrollleisten hinzugefügt und manuelles Ziehen zum Ändern der Größe deaktiviert, um die Benutzerinteraktion zu verbessern"
        }
      },
      {
        type: "refactor",
        description: {
          zh: "创建 getTextareaClasses 工具函数，实现样式统一管理和维护",
          en: "Created getTextareaClasses utility function for unified style management and maintenance",
          hi: "एकीकृत शैली प्रबंधन और रखरखाव के लिए getTextareaClasses उपयोगिता फ़ंक्शन बनाया गया",
          de: "getTextareaClasses-Hilfsfunktion für einheitliches Stil-Management und Wartung erstellt"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "更新全部 21 个工具页面，确保 textarea 交互体验一致性",
          en: "Updated all 21 tool pages to ensure consistent textarea interaction experience",
          hi: "स्थिर टेक्स्टएरिया इंटरैक्शन अनुभव सुनिश्चित करने के लिए सभी 21 टूल पेज अपडेट किए गए",
          de: "Alle 21 Tool-Seiten aktualisiert, um eine konsistente Textarea-Interaktionserfahrung zu gewährleisten"
        }
      }
    ]
  },
  {
    version: "v0.5.0",
    date: "2025-09-14",
    type: "minor",
    title: {
      zh: "体验优化阶段",
      en: "Experience Optimization Phase",
      hi: "अनुभव अनुकूलन चरण",
      de: "Erfahrungs-Optimierungsphase"
    },
    description: {
      zh: "组件SEO完善和侧边栏架构重构",
      en: "Component SEO improvements and sidebar architecture refactoring",
      hi: "घटक SEO सुधार और साइडबार आर्किटेक्चर रिफैक्टरिंग",
      de: "Komponenten-SEO-Verbesserungen und Seitenleisten-Architektur-Refaktorierung"
    },
    changes: [
      {
        type: "refactor",
        description: {
          zh: "侧边栏重构，提升用户体验",
          en: "Sidebar refactoring to improve user experience",
          hi: "उपयोगकर्ता अनुभव में सुधार के लिए साइडबार रिफैक्टरिंग",
          de: "Seitenleisten-Refaktorierung zur Verbesserung der Benutzererfahrung"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "优化侧边栏交互逻辑",
          en: "Optimize sidebar interaction logic",
          hi: "साइडबार इंटरैक्शन लॉजिक का अनुकूलन",
          de: "Optimierung der Seitenleisten-Interaktionslogik"
        }
      }
    ]
  },
  {
    version: "v0.4.0",
    date: "2025-09-12",
    type: "minor",
    title: {
      zh: "功能扩展阶段",
      en: "Feature Expansion Phase",
      hi: "सुविधा विस्तार चरण",
      de: "Feature-Erweiterungsphase"
    },
    description: {
      zh: "新增多种实用工具，丰富工具生态",
      en: "Add various practical tools to enrich the tool ecosystem",
      hi: "टूल इकोसिस्टम को समृद्ध बनाने के लिए विभिन्न व्यावहारिक टूल जोड़े गए",
      de: "Hinzufügung verschiedener praktischer Tools zur Bereicherung des Tool-Ökosystems"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "增加网络工具：IP地址查询功能",
          en: "Add network tools: IP address lookup functionality",
          hi: "नेटवर्क टूल्स जोड़े गए: IP पता खोज कार्यक्षमता",
          de: "Netzwerk-Tools hinzugefügt: IP-Adress-Lookup-Funktionalität"
        }
      },
      {
        type: "feat",
        description: {
          zh: "新增二维码生成和SVG占位图生成器",
          en: "Add QR code generator and SVG placeholder generator",
          hi: "QR कोड जेनरेटर और SVG प्लेसहोल्डर जेनरेटर जोड़े गए",
          de: "QR-Code-Generator und SVG-Platzhalter-Generator hinzugefügt"
        }
      },
      {
        type: "feat",
        description: {
          zh: "集成加密工具：Base64编解码、URL编解码",
          en: "Integrate encryption tools: Base64 encoding/decoding, URL encoding/decoding",
          hi: "एन्क्रिप्शन टूल्स एकीकृत किए गए: Base64 एन्कोडिंग/डिकोडिंग, URL एन्कोडिंग/डिकोडिंग",
          de: "Verschlüsselungstools integriert: Base64-Kodierung/Dekodierung, URL-Kodierung/Dekodierung"
        }
      },
      {
        type: "fix",
        description: {
          zh: "修复翻译文件缺失和重复问题",
          en: "Fix missing and duplicate translation file issues",
          hi: "अनुपस्थित और डुप्लिकेट अनुवाद फ़ाइल समस्याओं को ठीक किया गया",
          de: "Fehlende und doppelte Übersetzungsdateiprobleme behoben"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "优化前端展示效果和用户界面",
          en: "Optimize frontend display effects and user interface",
          hi: "फ्रंटएंड डिस्प्ले प्रभाव और उपयोगकर्ता इंटरफ़ेस का अनुकूलन",
          de: "Optimierung der Frontend-Anzeigeeffekte und Benutzeroberfläche"
        }
      }
    ]
  },
  {
    version: "v0.3.0",
    date: "2025-09-10",
    type: "minor",
    title: {
      zh: "SEO与基础优化",
      en: "SEO and Basic Optimization",
      hi: "SEO और मूलभूत अनुकूलन",
      de: "SEO und grundlegende Optimierung"
    },
    description: {
      zh: "完善SEO配置，优化用户体验和站点索引",
      en: "Improve SEO configuration, optimize user experience and site indexing",
      hi: "SEO कॉन्फ़िगरेशन में सुधार, उपयोगकर्ता अनुभव और साइट इंडेक्सिंग का अनुकूलन",
      de: "Verbesserung der SEO-Konfiguration, Optimierung der Benutzererfahrung und Site-Indexierung"
    },
    changes: [
      {
        type: "optimize",
        description: {
          zh: "站点地图优化，支持多语言路径",
          en: "Sitemap optimization with multi-language path support",
          hi: "कई भाषाओं के पाथ सपोर्ट के साथ साइटमैप अनुकूलन",
          de: "Sitemap-Optimierung mit mehrsprachiger Pfadunterstützung"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "SEO元数据处理和界面交互优化",
          en: "SEO metadata processing and interface interaction optimization",
          hi: "SEO मेटाडेटा प्रोसेसिंग और इंटरफ़ेस इंटरैक्शन अनुकूलन",
          de: "SEO-Metadatenverarbeitung und Schnittstelleninteraktionsoptimierung"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "子页面导航优化，支持返回主界面",
          en: "Sub-page navigation optimization with return to main interface support",
          hi: "मुख्य इंटरफ़ेस पर वापस आने के सपोर्ट के साथ सब-पेज नेविगेशन अनुकूलन",
          de: "Unterseiten-Navigationsoptimierung mit Unterstützung für die Rückkehr zur Hauptoberfläche"
        }
      }
    ]
  },
  {
    version: "v0.2.0",
    date: "2025-09-08",
    type: "minor",
    title: {
      zh: "国际化升级",
      en: "Internationalization Upgrade",
      hi: "अंतर्राष्ट्रीयकरण अपग्रेड",
      de: "Internationalisierungs-Upgrade"
    },
    description: {
      zh: "完善多语言支持，新增Hindi语言",
      en: "Improve multi-language support, add Hindi language",
      hi: "बहुभाषा समर्थन में सुधार, हिंदी भाषा जोड़ी गई",
      de: "Verbesserung der mehrsprachigen Unterstützung, Hindi-Sprache hinzugefügt"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "增加印度语(Hindi)支持，实现三语言体系",
          en: "Add Hindi language support, implement three-language system",
          hi: "हिंदी भाषा का समर्थन जोड़ा गया, तीन भाषाओं का सिस्टम लागू किया गया",
          de: "Hindi-Sprachunterstützung hinzugefügt, Drei-Sprachen-System implementiert"
        }
      },
      {
        type: "refactor",
        description: {
          zh: "布局重构，优化响应式设计",
          en: "Layout refactoring, optimize responsive design",
          hi: "लेआउट रिफैक्टरिंग, रिस्पॉन्सिव डिज़ाइन का अनुकूलन",
          de: "Layout-Refaktorierung, Optimierung des responsiven Designs"
        }
      },
      {
        type: "fix",
        description: {
          zh: "JSON转CSV工具转换问题修复",
          en: "Fix JSON to CSV tool conversion issues",
          hi: "JSON से CSV टूल कनवर्शन समस्याओं को ठीक किया गया",
          de: "JSON-zu-CSV-Tool-Konvertierungsprobleme behoben"
        }
      }
    ]
  },
  {
    version: "v0.1.0",
    date: "2025-09-07",
    type: "minor",
    title: {
      zh: "项目基础搭建",
      en: "Project Foundation Setup",
      hi: "परियोजना फाउंडेशन सेटअप",
      de: "Projekt-Grundlagen-Setup"
    },
    description: {
      zh: "初始版本发布，建立核心架构和基础工具",
      en: "Initial version release, establish core architecture and basic tools",
      hi: "प्रारंभिक संस्करण रिलीज़, मूल आर्किटेक्चर और मूलभूत टूल्स की स्थापना",
      de: "Erste Version veröffentlicht, Kernarchitektur und grundlegende Tools etabliert"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "项目初始化，建立Next.js + TypeScript架构",
          en: "Project initialization, establish Next.js + TypeScript architecture",
          hi: "परियोजना इनिशियलाइज़ेशन, Next.js + TypeScript आर्किटेक्चर की स्थापना",
          de: "Projektinitialisierung, Next.js + TypeScript-Architektur etabliert"
        }
      },
      {
        type: "feat",
        description: {
          zh: "多语言支持系统搭建(中文/英文)",
          en: "Multi-language support system setup (Chinese/English)",
          hi: "बहुभाषा समर्थन सिस्टम सेटअप (चीनी/अंग्रेजी)",
          de: "Mehrsprachiges Unterstützungssystem eingerichtet (Chinesisch/Englisch)"
        }
      },
      {
        type: "feat",
        description: {
          zh: "JSON工具集开发：格式化、转CSV功能",
          en: "JSON tool set development: formatting, CSV conversion functionality",
          hi: "JSON टूल सेट डेवलपमेंट: फॉरमैटिंग, CSV कनवर्शन कार्यक्षमता",
          de: "JSON-Toolset-Entwicklung: Formatierung, CSV-Konvertierungsfunktionalität"
        }
      },
      {
        type: "feat",
        description: {
          zh: "基础UI组件库和主题系统建立",
          en: "Basic UI component library and theme system establishment",
          hi: "मूलभूत UI कॉम्पोनेंट लाइब्रेरी और थीम सिस्टम की स्थापना",
          de: "Grundlegende UI-Komponentenbibliothek und Theme-System etabliert"
        }
      }
    ]
  }
];

export function getChangelogByVersion(version?: string): ChangelogEntry | ChangelogEntry[] {
  if (version) {
    return changelogData.find(entry => entry.version === version) || changelogData[0];
  }
  return changelogData;
}

export function getLatestVersion(): ChangelogEntry {
  return changelogData[0];
}

// 本地化数据条目类型（已转换为字符串）
export interface LocalizedChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  title: string;
  description: string;
  changes: {
    type: 'feat' | 'fix' | 'optimize' | 'refactor';
    description: string;
  }[];
}

// 获取本地化的 changelog 数据
const resolveLocalizedText = (text: LocalizedText, locale: string): string => {
  return text[locale as keyof LocalizedText] ?? text.en ?? text.zh;
};

export function getLocalizedChangelogData(locale: string = 'zh'): LocalizedChangelogEntry[] {
  return changelogData.map(entry => ({
    ...entry,
    title: resolveLocalizedText(entry.title, locale),
    description: resolveLocalizedText(entry.description, locale),
    changes: entry.changes.map(change => ({
      ...change,
      description: resolveLocalizedText(change.description, locale)
    }))
  }));
}

// 获取本地化的单个版本数据
export function getLocalizedChangelogByVersion(version?: string, locale: string = 'zh'): LocalizedChangelogEntry | LocalizedChangelogEntry[] {
  const localizedData = getLocalizedChangelogData(locale);
  if (version) {
    return localizedData.find(entry => entry.version === version) || localizedData[0];
  }
  return localizedData;
}

// 获取本地化的最新版本
export function getLocalizedLatestVersion(locale: string = 'zh'): LocalizedChangelogEntry {
  const localizedData = getLocalizedChangelogData(locale);
  return localizedData[0];
}