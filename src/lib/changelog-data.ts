interface LocalizedText {
  zh: string;
  en: string;
  hi: string;
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
    version: "v0.8.0",
    date: "2025-10-12",
    type: "minor",
    title: {
      zh: "开发工具与图像处理扩展",
      en: "Developer Tools and Image Processing Expansion",
      hi: "डेवलपर टूल्स और इमेज प्रोसेसिंग विस्तार"
    },
    description: {
      zh: "新增cURL转换器、图标设计器和图片转点阵图工具，丰富开发者工具和图像处理功能",
      en: "Added cURL converter, icon designer and image-to-dot-matrix tools, enriching developer tools and image processing capabilities",
      hi: "cURL कनवर्टर, आइकन डिज़ाइनर और इमेज-टू-डॉट-मैट्रिक्स टूल जोड़े गए, डेवलपर टूल्स और इमेज प्रोसेसिंग क्षमताओं में वृद्धि"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "新增cURL转换器：支持将cURL命令转换为JavaScript(Fetch)、Node.js(Axios)、Python(Requests)、PHP和Go等多种语言代码，并提供在线测试功能",
          en: "Added cURL converter: converts cURL commands to multiple languages including JavaScript(Fetch), Node.js(Axios), Python(Requests), PHP, and Go, with online testing feature",
          hi: "cURL कनवर्टर जोड़ा गया: cURL कमांड को JavaScript(Fetch), Node.js(Axios), Python(Requests), PHP, और Go सहित कई भाषाओं में परिवर्तित करता है, ऑनलाइन टेस्टिंग सुविधा के साथ"
        }
      },
      {
        type: "feat",
        description: {
          zh: "新增图标设计器：支持创建1-3个字符的文字图标，提供方形、圆形、圆角和超椭圆等形状，可导出SVG、PNG和ICO多种格式，支持7种标准尺寸(16px-1024px)批量导出",
          en: "Added icon designer: create text-based icons with 1-3 characters, supports square, circle, rounded and squircle shapes, exports to SVG, PNG and ICO formats, batch export in 7 standard sizes (16px-1024px)",
          hi: "आइकन डिज़ाइनर जोड़ा गया: 1-3 अक्षरों के साथ टेक्स्ट-आधारित आइकन बनाएं, स्क्वायर, सर्कल, राउंडेड और स्क्विर्कल आकृतियों का समर्थन करता है, SVG, PNG और ICO फॉर्मेट में निर्यात, 7 मानक आकारों (16px-1024px) में बैच निर्यात"
        }
      },
      {
        type: "feat",
        description: {
          zh: "新增图片转点阵图工具：将图片或文字转换为艺术点阵图，支持圆形、方形、菱形和六边形点，提供灰度、黑白和彩色三种模式，可自定义点大小、间距和背景，导出PNG和SVG格式",
          en: "Added image-to-dot-matrix tool: converts images or text to artistic dot matrix, supports circle, square, diamond and hexagon dots, offers grayscale, black&white and color modes, customizable dot size, spacing and background, exports to PNG and SVG",
          hi: "इमेज-टू-डॉट-मैट्रिक्स टूल जोड़ा गया: छवियों या टेक्स्ट को कलात्मक डॉट मैट्रिक्स में परिवर्तित करता है, सर्कल, स्क्वायर, डायमंड और हेक्सागन डॉट्स का समर्थन करता है, ग्रेस्केल, ब्लैक एंड व्हाइट और कलर मोड प्रदान करता है, अनुकूलन योग्य डॉट आकार, स्पेसिंग और पृष्ठभूमि, PNG और SVG में निर्यात"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "cURL转换器集成代理API功能，解决跨域问题，支持在线测试API请求并实时查看响应结果",
          en: "cURL converter integrates proxy API to solve CORS issues, supports online API request testing with real-time response viewing",
          hi: "cURL कनवर्टर CORS समस्याओं को हल करने के लिए प्रॉक्सी API को एकीकृत करता है, वास्तविक समय प्रतिक्रिया देखने के साथ ऑनलाइन API अनुरोध परीक्षण का समर्थन करता है"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "图标设计器支持预设颜色方案和随机配色，提供8种预设颜色组合和全屏预览功能，优化大尺寸图标的预览体验",
          en: "Icon designer supports preset color schemes and random colors, provides 8 preset color combinations and fullscreen preview, optimized preview experience for large icons",
          hi: "आइकन डिज़ाइनर प्रीसेट कलर स्कीम और रैंडम रंगों का समर्थन करता है, 8 प्रीसेट कलर कॉम्बिनेशन और फुलस्क्रीन प्रीव्यू प्रदान करता है, बड़े आइकनों के लिए अनुकूलित प्रीव्यू अनुभव"
        }
      },
      {
        type: "feat",
        description: {
          zh: "图片转点阵图工具支持图片和文字两种输入模式，文字模式可自定义字体大小、粗细和字体类型",
          en: "Image-to-dot-matrix tool supports both image and text input modes, text mode allows customization of font size, weight and font family",
          hi: "इमेज-टू-डॉट-मैट्रिक्स टूल छवि और टेक्स्ट दोनों इनपुट मोड का समर्थन करता है, टेक्स्ट मोड फ़ॉन्ट आकार, वजन और फ़ॉन्ट परिवार के अनुकूलन की अनुमति देता है"
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
      hi: "टूल विस्तार और श्रेणी अनुकूलन"
    },
    description: {
      zh: "新增UUID生成器，重构格式转换工具为双向转换，优化工具分类结构",
      en: "Added UUID generator, refactored format conversion tools to bidirectional conversion, optimized tool category structure",
      hi: "UUID जेनरेटर जोड़ा गया, द्विदिश रूपांतरण के लिए फॉर्मेट कनवर्शन टूल को रिफैक्टर किया गया, टूल श्रेणी संरचना का अनुकूलन"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "新增UUID生成器：支持批量生成1-1000个UUID，提供多种输出格式（标准、大写、无横杠等）",
          en: "Added UUID generator: supports batch generation of 1-1000 UUIDs with multiple output formats (standard, uppercase, no-dash, etc.)",
          hi: "UUID जेनरेटर जोड़ा गया: कई आउटपुट फॉर्मेट (स्टैंडर्ड, अपरकेस, नो-डैश आदि) के साथ 1-1000 UUID की बैच जेनरेशन का समर्थन"
        }
      },
      {
        type: "feat",
        description: {
          zh: "创建生成器工具分类：将UUID生成器和密码生成器归类到独立分类，优化工具组织结构",
          en: "Created 'Generator Tools' category: organized UUID generator and password generator into independent category, optimized tool structure",
          hi: "'जेनरेटर टूल्स' श्रेणी बनाई गई: UUID जेनरेटर और पासवर्ड जेनरेटर को स्वतंत्र श्रेणी में व्यवस्थित किया गया, टूल संरचना का अनुकूलन"
        }
      },
      {
        type: "refactor",
        description: {
          zh: "格式转换工具双向转换升级：JSON⇄CSV、JSON⇄YAML、JSON⇄XML，支持一键切换转换方向",
          en: "Format conversion tools upgraded to bidirectional conversion: JSON⇄CSV, JSON⇄YAML, JSON⇄XML with one-click direction switching",
          hi: "फॉर्मेट कनवर्शन टूल को द्विदिश रूपांतरण में अपग्रेड किया गया: JSON⇄CSV, JSON⇄YAML, JSON⇄XML वन-क्लिक दिशा स्विचिंग के साथ"
        }
      },
      {
        type: "feat",
        description: {
          zh: "CSV转JSON功能：智能解析CSV数据，支持嵌套对象反扁平化和数据类型识别",
          en: "CSV to JSON conversion: intelligent CSV parsing with nested object unflatten and data type recognition",
          hi: "CSV से JSON रूपांतरण: नेस्टेड ऑब्जेक्ट अनफ्लैटन और डेटा प्रकार पहचान के साथ बुद्धिमान CSV पार्सिंग"
        }
      },
      {
        type: "feat",
        description: {
          zh: "YAML转JSON和XML转JSON功能：完整实现双向数据格式转换能力",
          en: "YAML to JSON and XML to JSON conversion: fully implemented bidirectional data format conversion",
          hi: "YAML से JSON और XML से JSON रूपांतरण: पूरी तरह से द्विदिश डेटा फॉर्मेट रूपांतरण लागू किया गया"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "更新工具分类描述：将转换器重命名为格式转换器，突出双向转换特性",
          en: "Updated tool category description: renamed 'Converters' to 'Format Converters', highlighting bidirectional conversion features",
          hi: "टूल श्रेणी विवरण अपडेट किया गया: 'कन्वर्टर्स' का नाम बदलकर 'फॉर्मेट कन्वर्टर्स' किया गया, द्विदिश रूपांतरण सुविधाओं को उजागर किया गया"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "完善相关工具推荐系统：在related-tools组件中添加新工具支持",
          en: "Improved related tools recommendation system: added new tool support in related-tools component",
          hi: "संबंधित टूल्स अनुशंसा प्रणाली में सुधार: related-tools कॉम्पोनेंट में नए टूल समर्थन जोड़ा गया"
        }
      },
      {
        type: "fix",
        description: {
          zh: "代码质量优化：修复所有ESLint警告和错误，移除未使用变量，改进类型定义",
          en: "Code quality optimization: fixed all ESLint warnings and errors, removed unused variables, improved type definitions",
          hi: "कोड गुणवत्ता अनुकूलन: सभी ESLint चेतावनियाँ और त्रुटियाँ ठीक की गईं, अप्रयुक्त वैरिएबल हटाए गए, प्रकार परिभाषाओं में सुधार"
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
      hi: "उपयोगकर्ता अनुभव अनुकूलन अपग्रेड"
    },
    description: {
      zh: "全面优化工具页面 textarea 组件，提升响应式体验和交互一致性",
      en: "Comprehensive optimization of tool page textarea components, improving responsive experience and interaction consistency",
      hi: "टूल पेज टेक्स्टएरिया कॉम्पोनेंट्स का व्यापक अनुकूलन, रिस्पॉन्सिव अनुभव और इंटरैक्शन स्थिरता में सुधार"
    },
    changes: [
      {
        type: "optimize",
        description: {
          zh: "统一 textarea 组件高度限制：移动端和桌面端均为 300px 最大高度",
          en: "Unified textarea component height limits: 300px maximum height for both mobile and desktop",
          hi: "एकीकृत टेक्स्टएरिया घटक ऊंचाई सीमा: मोबाइल और डेस्कटॉप दोनों के लिए 300px अधिकतम ऊंचाई"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "添加响应式滚动条和禁用手动拖拽调整，改善用户交互体验",
          en: "Added responsive scrollbars and disabled manual drag resize to improve user interaction experience",
          hi: "उपयोगकर्ता इंटरैक्शन अनुभव में सुधार के लिए रिस्पॉन्सिव स्क्रॉलबार जोड़े गए और मैन्युअल ड्रैग रीसाइज़ को अक्षम किया गया"
        }
      },
      {
        type: "refactor",
        description: {
          zh: "创建 getTextareaClasses 工具函数，实现样式统一管理和维护",
          en: "Created getTextareaClasses utility function for unified style management and maintenance",
          hi: "एकीकृत शैली प्रबंधन और रखरखाव के लिए getTextareaClasses उपयोगिता फ़ंक्शन बनाया गया"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "更新全部 21 个工具页面，确保 textarea 交互体验一致性",
          en: "Updated all 21 tool pages to ensure consistent textarea interaction experience",
          hi: "स्थिर टेक्स्टएरिया इंटरैक्शन अनुभव सुनिश्चित करने के लिए सभी 21 टूल पेज अपडेट किए गए"
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
      hi: "अनुभव अनुकूलन चरण"
    },
    description: {
      zh: "组件SEO完善和侧边栏架构重构",
      en: "Component SEO improvements and sidebar architecture refactoring",
      hi: "घटक SEO सुधार और साइडबार आर्किटेक्चर रिफैक्टरिंग"
    },
    changes: [
      {
        type: "refactor",
        description: {
          zh: "侧边栏重构，提升用户体验",
          en: "Sidebar refactoring to improve user experience",
          hi: "उपयोगकर्ता अनुभव में सुधार के लिए साइडबार रिफैक्टरिंग"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "优化侧边栏交互逻辑",
          en: "Optimize sidebar interaction logic",
          hi: "साइडबार इंटरैक्शन लॉजिक का अनुकूलन"
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
      hi: "सुविधा विस्तार चरण"
    },
    description: {
      zh: "新增多种实用工具，丰富工具生态",
      en: "Add various practical tools to enrich the tool ecosystem",
      hi: "टूल इकोसिस्टम को समृद्ध बनाने के लिए विभिन्न व्यावहारिक टूल जोड़े गए"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "增加网络工具：IP地址查询功能",
          en: "Add network tools: IP address lookup functionality",
          hi: "नेटवर्क टूल्स जोड़े गए: IP पता खोज कार्यक्षमता"
        }
      },
      {
        type: "feat",
        description: {
          zh: "新增二维码生成和SVG占位图生成器",
          en: "Add QR code generator and SVG placeholder generator",
          hi: "QR कोड जेनरेटर और SVG प्लेसहोल्डर जेनरेटर जोड़े गए"
        }
      },
      {
        type: "feat",
        description: {
          zh: "集成加密工具：Base64编解码、URL编解码",
          en: "Integrate encryption tools: Base64 encoding/decoding, URL encoding/decoding",
          hi: "एन्क्रिप्शन टूल्स एकीकृत किए गए: Base64 एन्कोडिंग/डिकोडिंग, URL एन्कोडिंग/डिकोडिंग"
        }
      },
      {
        type: "fix",
        description: {
          zh: "修复翻译文件缺失和重复问题",
          en: "Fix missing and duplicate translation file issues",
          hi: "अनुपस्थित और डुप्लिकेट अनुवाद फ़ाइल समस्याओं को ठीक किया गया"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "优化前端展示效果和用户界面",
          en: "Optimize frontend display effects and user interface",
          hi: "फ्रंटएंड डिस्प्ले प्रभाव और उपयोगकर्ता इंटरफ़ेस का अनुकूलन"
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
      hi: "SEO और मूलभूत अनुकूलन"
    },
    description: {
      zh: "完善SEO配置，优化用户体验和站点索引",
      en: "Improve SEO configuration, optimize user experience and site indexing",
      hi: "SEO कॉन्फ़िगरेशन में सुधार, उपयोगकर्ता अनुभव और साइट इंडेक्सिंग का अनुकूलन"
    },
    changes: [
      {
        type: "optimize",
        description: {
          zh: "站点地图优化，支持多语言路径",
          en: "Sitemap optimization with multi-language path support",
          hi: "कई भाषाओं के पाथ सपोर्ट के साथ साइटमैप अनुकूलन"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "SEO元数据处理和界面交互优化",
          en: "SEO metadata processing and interface interaction optimization",
          hi: "SEO मेटाडेटा प्रोसेसिंग और इंटरफ़ेस इंटरैक्शन अनुकूलन"
        }
      },
      {
        type: "optimize",
        description: {
          zh: "子页面导航优化，支持返回主界面",
          en: "Sub-page navigation optimization with return to main interface support",
          hi: "मुख्य इंटरफ़ेस पर वापस आने के सपोर्ट के साथ सब-पेज नेविगेशन अनुकूलन"
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
      hi: "अंतर्राष्ट्रीयकरण अपग्रेड"
    },
    description: {
      zh: "完善多语言支持，新增Hindi语言",
      en: "Improve multi-language support, add Hindi language",
      hi: "बहुभाषा समर्थन में सुधार, हिंदी भाषा जोड़ी गई"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "增加印度语(Hindi)支持，实现三语言体系",
          en: "Add Hindi language support, implement three-language system",
          hi: "हिंदी भाषा का समर्थन जोड़ा गया, तीन भाषाओं का सिस्टम लागू किया गया"
        }
      },
      {
        type: "refactor",
        description: {
          zh: "布局重构，优化响应式设计",
          en: "Layout refactoring, optimize responsive design",
          hi: "लेआउट रिफैक्टरिंग, रिस्पॉन्सिव डिज़ाइन का अनुकूलन"
        }
      },
      {
        type: "fix",
        description: {
          zh: "JSON转CSV工具转换问题修复",
          en: "Fix JSON to CSV tool conversion issues",
          hi: "JSON से CSV टूल कनवर्शन समस्याओं को ठीक किया गया"
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
      hi: "परियोजना फाउंडेशन सेटअप"
    },
    description: {
      zh: "初始版本发布，建立核心架构和基础工具",
      en: "Initial version release, establish core architecture and basic tools",
      hi: "प्रारंभिक संस्करण रिलीज़, मूल आर्किटेक्चर और मूलभूत टूल्स की स्थापना"
    },
    changes: [
      {
        type: "feat",
        description: {
          zh: "项目初始化，建立Next.js + TypeScript架构",
          en: "Project initialization, establish Next.js + TypeScript architecture",
          hi: "परियोजना इनिशियलाइज़ेशन, Next.js + TypeScript आर्किटेक्चर की स्थापना"
        }
      },
      {
        type: "feat",
        description: {
          zh: "多语言支持系统搭建(中文/英文)",
          en: "Multi-language support system setup (Chinese/English)",
          hi: "बहुभाषा समर्थन सिस्टम सेटअप (चीनी/अंग्रेजी)"
        }
      },
      {
        type: "feat",
        description: {
          zh: "JSON工具集开发：格式化、转CSV功能",
          en: "JSON tool set development: formatting, CSV conversion functionality",
          hi: "JSON टूल सेट डेवलपमेंट: फॉरमैटिंग, CSV कनवर्शन कार्यक्षमता"
        }
      },
      {
        type: "feat",
        description: {
          zh: "基础UI组件库和主题系统建立",
          en: "Basic UI component library and theme system establishment",
          hi: "मूलभूत UI कॉम्पोनेंट लाइब्रेरी और थीम सिस्टम की स्थापना"
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
export function getLocalizedChangelogData(locale: string = 'zh'): LocalizedChangelogEntry[] {
  return changelogData.map(entry => ({
    ...entry,
    title: entry.title[locale as keyof LocalizedText] || entry.title.zh,
    description: entry.description[locale as keyof LocalizedText] || entry.description.zh,
    changes: entry.changes.map(change => ({
      ...change,
      description: change.description[locale as keyof LocalizedText] || change.description.zh
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