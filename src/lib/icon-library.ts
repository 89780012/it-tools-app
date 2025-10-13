// 图标库配置
export interface IconItem {
  id: string
  name: string
  nameZh: string
  category: string
  svg: string // SVG path或完整内容
}

export const ICON_CATEGORIES = [
  { id: 'social', name: 'Social', nameZh: '社交' },
  { id: 'communication', name: 'Communication', nameZh: '通讯' },
  { id: 'business', name: 'Business', nameZh: '商务' },
  { id: 'tech', name: 'Technology', nameZh: '科技' },
  { id: 'finance', name: 'Finance', nameZh: '金融' },
  { id: 'media', name: 'Media', nameZh: '媒体' },
  { id: 'shapes', name: 'Shapes', nameZh: '形状' },
  { id: 'arrows', name: 'Arrows', nameZh: '箭头' },
]

// 预设图标库（使用简单的SVG path）
export const ICON_LIBRARY: IconItem[] = [
  // 社交图标
  {
    id: 'heart',
    name: 'Heart',
    nameZh: '爱心',
    category: 'social',
    svg: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>'
  },
  {
    id: 'star',
    name: 'Star',
    nameZh: '星星',
    category: 'social',
    svg: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>'
  },
  {
    id: 'thumbs-up',
    name: 'Thumbs Up',
    nameZh: '点赞',
    category: 'social',
    svg: '<path d="M7 22V11M2 13v6c0 1.1.9 2 2 2h1M16.5 3c-.5 0-1 .2-1.4.6L10 9.5V22h9.5c.8 0 1.5-.7 1.5-1.5v-9c0-.8-.7-1.5-1.5-1.5H16l2-5.5c.2-.5 0-1-.3-1.3-.3-.3-.8-.5-1.2-.5z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'user',
    name: 'User',
    nameZh: '用户',
    category: 'social',
    svg: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" fill="none" stroke-width="2"/>'
  },
  
  // 通讯图标
  {
    id: 'mail',
    name: 'Mail',
    nameZh: '邮件',
    category: 'communication',
    svg: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22,6 12,13 2,6" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'message-circle',
    name: 'Message',
    nameZh: '消息',
    category: 'communication',
    svg: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'phone',
    name: 'Phone',
    nameZh: '电话',
    category: 'communication',
    svg: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'bell',
    name: 'Bell',
    nameZh: '通知',
    category: 'communication',
    svg: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  
  // 商务图标
  {
    id: 'briefcase',
    name: 'Briefcase',
    nameZh: '公文包',
    category: 'business',
    svg: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'shopping-cart',
    name: 'Cart',
    nameZh: '购物车',
    category: 'business',
    svg: '<circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'chart',
    name: 'Chart',
    nameZh: '图表',
    category: 'business',
    svg: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    nameZh: '日历',
    category: 'business',
    svg: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  
  // 科技图标
  {
    id: 'code',
    name: 'Code',
    nameZh: '代码',
    category: 'tech',
    svg: '<polyline points="16 18 22 12 16 6" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="8 6 2 12 8 18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'cpu',
    name: 'CPU',
    nameZh: '处理器',
    category: 'tech',
    svg: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="9" y="9" width="6" height="6" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="9" y1="1" x2="9" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="15" y1="1" x2="15" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="9" y1="20" x2="9" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="15" y1="20" x2="15" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="20" y1="9" x2="23" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="20" y1="14" x2="23" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="1" y1="9" x2="4" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="1" y1="14" x2="4" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'database',
    name: 'Database',
    nameZh: '数据库',
    category: 'tech',
    svg: '<ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'cloud',
    name: 'Cloud',
    nameZh: '云',
    category: 'tech',
    svg: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  
  // 金融图标
  {
    id: 'dollar',
    name: 'Dollar',
    nameZh: '美元',
    category: 'finance',
    svg: '<line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'credit-card',
    name: 'Credit Card',
    nameZh: '信用卡',
    category: 'finance',
    svg: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'trending-up',
    name: 'Trending Up',
    nameZh: '增长',
    category: 'finance',
    svg: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="17 6 23 6 23 12" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  
  // 媒体图标
  {
    id: 'camera',
    name: 'Camera',
    nameZh: '相机',
    category: 'media',
    svg: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'music',
    name: 'Music',
    nameZh: '音乐',
    category: 'media',
    svg: '<path d="M9 18V5l12-2v13" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="16" r="3" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'video',
    name: 'Video',
    nameZh: '视频',
    category: 'media',
    svg: '<polygon points="23 7 16 12 23 17 23 7" fill="currentColor"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'image',
    name: 'Image',
    nameZh: '图片',
    category: 'media',
    svg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><polyline points="21 15 16 10 5 21" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  
  // 形状图标
  {
    id: 'circle-fill',
    name: 'Circle',
    nameZh: '圆形',
    category: 'shapes',
    svg: '<circle cx="12" cy="12" r="10" fill="currentColor"/>'
  },
  {
    id: 'square-fill',
    name: 'Square',
    nameZh: '方形',
    category: 'shapes',
    svg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="currentColor"/>'
  },
  {
    id: 'triangle',
    name: 'Triangle',
    nameZh: '三角形',
    category: 'shapes',
    svg: '<path d="M12 2 L22 22 L2 22 Z" fill="currentColor"/>'
  },
  {
    id: 'hexagon-fill',
    name: 'Hexagon',
    nameZh: '六边形',
    category: 'shapes',
    svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="currentColor"/>'
  },
  
  // 箭头图标
  {
    id: 'arrow-up',
    name: 'Arrow Up',
    nameZh: '向上箭头',
    category: 'arrows',
    svg: '<line x1="12" y1="19" x2="12" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="5 12 12 5 19 12" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'arrow-right',
    name: 'Arrow Right',
    nameZh: '向右箭头',
    category: 'arrows',
    svg: '<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="12 5 19 12 12 19" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'chevron-up',
    name: 'Chevron Up',
    nameZh: '箭头向上',
    category: 'arrows',
    svg: '<polyline points="18 15 12 9 6 15" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'check',
    name: 'Check',
    nameZh: '勾选',
    category: 'arrows',
    svg: '<polyline points="20 6 9 17 4 12" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  },
]

