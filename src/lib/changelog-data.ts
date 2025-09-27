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