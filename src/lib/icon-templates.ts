// 多色几何模板定义
export interface MultiColorTemplate {
  id: string
  name: string
  category: string
  regions: {
    id: string
    label: string
    path: (size: number) => string
    defaultColor: string
  }[]
}

export const TEMPLATE_CATEGORIES = [
  { id: 'basic', name: 'Basic Split', nameZh: '基础分割' },
  { id: 'triangles', name: 'Triangles', nameZh: '三角形' },
  { id: 'stripes', name: 'Stripes & Bands', nameZh: '条纹' },
  { id: 'geometric', name: 'Geometric Shapes', nameZh: '几何形状' },
  { id: 'modern', name: 'Modern Patterns', nameZh: '现代图案' },
  { id: 'abstract', name: 'Abstract', nameZh: '抽象' },
]

export const MULTICOLOR_TEMPLATES: MultiColorTemplate[] = [
  // ===基础分割===
  {
    id: 'diagonal-split',
    name: 'Diagonal Split',
    category: 'basic',
    regions: [
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M 0,0 L ${size},0 L 0,${size} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#8B5CF6'
      }
    ]
  },
  {
    id: 'diagonal-split-reverse',
    name: 'Diagonal Split Reverse',
    category: 'basic',
    regions: [
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} Z`,
        defaultColor: '#EC4899'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M 0,0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#F472B6'
      }
    ]
  },
  {
    id: 'half-vertical',
    name: 'Half Vertical',
    category: 'basic',
    regions: [
      {
        id: 'left',
        label: 'Left',
        path: (size) => `M 0,0 L ${size/2},0 L ${size/2},${size} L 0,${size} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'right',
        label: 'Right',
        path: (size) => `M ${size/2},0 L ${size},0 L ${size},${size} L ${size/2},${size} Z`,
        defaultColor: '#14B8A6'
      }
    ]
  },
  {
    id: 'half-horizontal',
    name: 'Half Horizontal',
    category: 'basic',
    regions: [
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size/2} L 0,${size/2} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M 0,${size/2} L ${size},${size/2} L ${size},${size} L 0,${size} Z`,
        defaultColor: '#FBBF24'
      }
    ]
  },

  // ===三角形===
  {
    id: 'four-triangles',
    name: 'Four Triangles',
    category: 'triangles',
    regions: [
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M 0,0 L ${size},0 L ${size/2},${size/2} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'right',
        label: 'Right',
        path: (size) => `M ${size},0 L ${size},${size} L ${size/2},${size/2} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M ${size},${size} L 0,${size} L ${size/2},${size/2} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'left',
        label: 'Left',
        path: (size) => `M 0,${size} L 0,0 L ${size/2},${size/2} Z`,
        defaultColor: '#3B82F6'
      }
    ]
  },
  {
    id: 'triangle-top',
    name: 'Triangle Top',
    category: 'triangles',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#6366F1'
      },
      {
        id: 'triangle',
        label: 'Triangle',
        path: (size) => `M ${size*0.15},${size*0.15} L ${size*0.85},${size*0.15} L ${size/2},${size*0.6} Z`,
        defaultColor: '#EC4899'
      }
    ]
  },
  {
    id: 'triangle-bottom',
    name: 'Triangle Bottom',
    category: 'triangles',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#14B8A6'
      },
      {
        id: 'triangle',
        label: 'Triangle',
        path: (size) => `M ${size/2},${size*0.4} L ${size*0.85},${size*0.85} L ${size*0.15},${size*0.85} Z`,
        defaultColor: '#F59E0B'
      }
    ]
  },
  {
    id: 'corner-triangles',
    name: 'Corner Triangles',
    category: 'triangles',
    regions: [
      {
        id: 'center',
        label: 'Center',
        path: (size) => `M ${size*0.25},${size*0.25} L ${size*0.75},${size*0.25} L ${size*0.75},${size*0.75} L ${size*0.25},${size*0.75} Z`,
        defaultColor: '#FFFFFF'
      },
      {
        id: 'top-left',
        label: 'Top Left',
        path: (size) => `M 0,0 L ${size*0.25},${size*0.25} L 0,${size*0.25} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'top-right',
        label: 'Top Right',
        path: (size) => `M ${size},0 L ${size},${size*0.25} L ${size*0.75},${size*0.25} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'bottom-left',
        label: 'Bottom Left',
        path: (size) => `M 0,${size} L ${size*0.25},${size*0.75} L 0,${size*0.75} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'bottom-right',
        label: 'Bottom Right',
        path: (size) => `M ${size},${size} L ${size*0.75},${size*0.75} L ${size},${size*0.75} Z`,
        defaultColor: '#10B981'
      }
    ]
  },

  // ===条纹===
  {
    id: 'horizontal-stripes-3',
    name: 'Horizontal Stripes (3)',
    category: 'stripes',
    regions: [
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size/3} L 0,${size/3} Z`,
        defaultColor: '#EC4899'
      },
      {
        id: 'middle',
        label: 'Middle',
        path: (size) => `M 0,${size/3} L ${size},${size/3} L ${size},${size*2/3} L 0,${size*2/3} Z`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M 0,${size*2/3} L ${size},${size*2/3} L ${size},${size} L 0,${size} Z`,
        defaultColor: '#6366F1'
      }
    ]
  },
  {
    id: 'vertical-stripes-3',
    name: 'Vertical Stripes (3)',
    category: 'stripes',
    regions: [
      {
        id: 'left',
        label: 'Left',
        path: (size) => `M 0,0 L ${size/3},0 L ${size/3},${size} L 0,${size} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'middle',
        label: 'Middle',
        path: (size) => `M ${size/3},0 L ${size*2/3},0 L ${size*2/3},${size} L ${size/3},${size} Z`,
        defaultColor: '#14B8A6'
      },
      {
        id: 'right',
        label: 'Right',
        path: (size) => `M ${size*2/3},0 L ${size},0 L ${size},${size} L ${size*2/3},${size} Z`,
        defaultColor: '#06B6D4'
      }
    ]
  },
  {
    id: 'horizontal-stripes-4',
    name: 'Horizontal Stripes (4)',
    category: 'stripes',
    regions: [
      {
        id: 'row1',
        label: 'Row 1',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size/4} L 0,${size/4} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'row2',
        label: 'Row 2',
        path: (size) => `M 0,${size/4} L ${size},${size/4} L ${size},${size/2} L 0,${size/2} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'row3',
        label: 'Row 3',
        path: (size) => `M 0,${size/2} L ${size},${size/2} L ${size},${size*3/4} L 0,${size*3/4} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'row4',
        label: 'Row 4',
        path: (size) => `M 0,${size*3/4} L ${size},${size*3/4} L ${size},${size} L 0,${size} Z`,
        defaultColor: '#3B82F6'
      }
    ]
  },
  {
    id: 'vertical-stripes-4',
    name: 'Vertical Stripes (4)',
    category: 'stripes',
    regions: [
      {
        id: 'col1',
        label: 'Col 1',
        path: (size) => `M 0,0 L ${size/4},0 L ${size/4},${size} L 0,${size} Z`,
        defaultColor: '#EC4899'
      },
      {
        id: 'col2',
        label: 'Col 2',
        path: (size) => `M ${size/4},0 L ${size/2},0 L ${size/2},${size} L ${size/4},${size} Z`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'col3',
        label: 'Col 3',
        path: (size) => `M ${size/2},0 L ${size*3/4},0 L ${size*3/4},${size} L ${size/2},${size} Z`,
        defaultColor: '#6366F1'
      },
      {
        id: 'col4',
        label: 'Col 4',
        path: (size) => `M ${size*3/4},0 L ${size},0 L ${size},${size} L ${size*3/4},${size} Z`,
        defaultColor: '#3B82F6'
      }
    ]
  },

  // ===几何形状===
  {
    id: 'circle-center',
    name: 'Circle Center',
    category: 'geometric',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'circle',
        label: 'Circle',
        path: (size) => `M ${size/2},${size/2} m -${size*0.35},0 a ${size*0.35},${size*0.35} 0 1,0 ${size*0.7},0 a ${size*0.35},${size*0.35} 0 1,0 -${size*0.7},0`,
        defaultColor: '#FFFFFF'
      }
    ]
  },
  {
    id: 'square-center',
    name: 'Square Center',
    category: 'geometric',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'square',
        label: 'Square',
        path: (size) => `M ${size*0.25},${size*0.25} L ${size*0.75},${size*0.25} L ${size*0.75},${size*0.75} L ${size*0.25},${size*0.75} Z`,
        defaultColor: '#FFFFFF'
      }
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'geometric',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#6366F1'
      },
      {
        id: 'diamond',
        label: 'Diamond',
        path: (size) => `M ${size/2},${size*0.15} L ${size*0.85},${size/2} L ${size/2},${size*0.85} L ${size*0.15},${size/2} Z`,
        defaultColor: '#F59E0B'
      }
    ]
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    category: 'geometric',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'hexagon',
        label: 'Hexagon',
        path: (size) => {
          const cx = size / 2
          const cy = size / 2
          const r = size * 0.35
          const points = []
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            points.push(`${x},${y}`)
          }
          return `M ${points.join(' L ')} Z`
        },
        defaultColor: '#FFFFFF'
      }
    ]
  },
  {
    id: 'corners',
    name: 'Four Corners',
    category: 'geometric',
    regions: [
      {
        id: 'center',
        label: 'Center',
        path: (size) => `M ${size*0.3},${size*0.3} L ${size*0.7},${size*0.3} L ${size*0.7},${size*0.7} L ${size*0.3},${size*0.7} Z`,
        defaultColor: '#FFFFFF'
      },
      {
        id: 'top-left',
        label: 'Top Left',
        path: (size) => `M 0,0 L ${size*0.3},0 L ${size*0.3},${size*0.3} L 0,${size*0.3} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'top-right',
        label: 'Top Right',
        path: (size) => `M ${size*0.7},0 L ${size},0 L ${size},${size*0.3} L ${size*0.7},${size*0.3} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'bottom-left',
        label: 'Bottom Left',
        path: (size) => `M 0,${size*0.7} L ${size*0.3},${size*0.7} L ${size*0.3},${size} L 0,${size} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'bottom-right',
        label: 'Bottom Right',
        path: (size) => `M ${size*0.7},${size*0.7} L ${size},${size*0.7} L ${size},${size} L ${size*0.7},${size} Z`,
        defaultColor: '#10B981'
      }
    ]
  },

  // ===现代图案===
  {
    id: 'chevron',
    name: 'Chevron',
    category: 'modern',
    regions: [
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size*0.4} L ${size/2},${size*0.6} L 0,${size*0.4} Z`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M 0,${size*0.4} L ${size/2},${size*0.6} L ${size},${size*0.4} L ${size},${size} L 0,${size} Z`,
        defaultColor: '#EC4899'
      }
    ]
  },
  {
    id: 'wave',
    name: 'Wave',
    category: 'modern',
    regions: [
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size*0.5} Q ${size*0.75},${size*0.3} ${size*0.5},${size*0.5} T 0,${size*0.5} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M 0,${size*0.5} Q ${size*0.25},${size*0.7} ${size*0.5},${size*0.5} T ${size},${size*0.5} L ${size},${size} L 0,${size} Z`,
        defaultColor: '#14B8A6'
      }
    ]
  },
  {
    id: 'arc-corner',
    name: 'Arc Corner',
    category: 'modern',
    regions: [
      {
        id: 'main',
        label: 'Main',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#6366F1'
      },
      {
        id: 'arc',
        label: 'Arc',
        path: (size) => `M 0,0 L ${size*0.5},0 Q ${size*0.5},${size*0.5} 0,${size*0.5} Z`,
        defaultColor: '#EC4899'
      }
    ]
  },
  {
    id: 'quarter-circles',
    name: 'Quarter Circles',
    category: 'modern',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#FFFFFF'
      },
      {
        id: 'top-left',
        label: 'Top Left',
        path: (size) => `M 0,0 L ${size*0.5},0 Q 0,0 0,${size*0.5} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'top-right',
        label: 'Top Right',
        path: (size) => `M ${size*0.5},0 L ${size},0 L ${size},${size*0.5} Q ${size},0 ${size*0.5},0 Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'bottom-left',
        label: 'Bottom Left',
        path: (size) => `M 0,${size*0.5} Q 0,${size} ${size*0.5},${size} L 0,${size} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'bottom-right',
        label: 'Bottom Right',
        path: (size) => `M ${size},${size*0.5} L ${size},${size} L ${size*0.5},${size} Q ${size},${size} ${size},${size*0.5} Z`,
        defaultColor: '#10B981'
      }
    ]
  },

  // ===抽象===
  {
    id: 'grid-4',
    name: 'Grid 2x2',
    category: 'abstract',
    regions: [
      {
        id: 'top-left',
        label: 'Top Left',
        path: (size) => `M 0,0 L ${size/2},0 L ${size/2},${size/2} L 0,${size/2} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'top-right',
        label: 'Top Right',
        path: (size) => `M ${size/2},0 L ${size},0 L ${size},${size/2} L ${size/2},${size/2} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'bottom-left',
        label: 'Bottom Left',
        path: (size) => `M 0,${size/2} L ${size/2},${size/2} L ${size/2},${size} L 0,${size} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'bottom-right',
        label: 'Bottom Right',
        path: (size) => `M ${size/2},${size/2} L ${size},${size/2} L ${size},${size} L ${size/2},${size} Z`,
        defaultColor: '#3B82F6'
      }
    ]
  },
  {
    id: 'concentric-squares',
    name: 'Concentric Squares',
    category: 'abstract',
    regions: [
      {
        id: 'outer',
        label: 'Outer',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'middle',
        label: 'Middle',
        path: (size) => `M ${size*0.15},${size*0.15} L ${size*0.85},${size*0.15} L ${size*0.85},${size*0.85} L ${size*0.15},${size*0.85} Z`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'inner',
        label: 'Inner',
        path: (size) => `M ${size*0.3},${size*0.3} L ${size*0.7},${size*0.3} L ${size*0.7},${size*0.7} L ${size*0.3},${size*0.7} Z`,
        defaultColor: '#EC4899'
      }
    ]
  },
  {
    id: 'concentric-circles',
    name: 'Concentric Circles',
    category: 'abstract',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#1E293B'
      },
      {
        id: 'outer',
        label: 'Outer Circle',
        path: (size) => `M ${size/2},${size/2} m -${size*0.45},0 a ${size*0.45},${size*0.45} 0 1,0 ${size*0.9},0 a ${size*0.45},${size*0.45} 0 1,0 -${size*0.9},0`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'middle',
        label: 'Middle Circle',
        path: (size) => `M ${size/2},${size/2} m -${size*0.3},0 a ${size*0.3},${size*0.3} 0 1,0 ${size*0.6},0 a ${size*0.3},${size*0.3} 0 1,0 -${size*0.6},0`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'inner',
        label: 'Inner Circle',
        path: (size) => `M ${size/2},${size/2} m -${size*0.15},0 a ${size*0.15},${size*0.15} 0 1,0 ${size*0.3},0 a ${size*0.15},${size*0.15} 0 1,0 -${size*0.3},0`,
        defaultColor: '#EC4899'
      }
    ]
  },
  {
    id: 'spiral',
    name: 'Spiral',
    category: 'abstract',
    regions: [
      {
        id: 'quarter1',
        label: 'Quarter 1',
        path: (size) => `M 0,0 L ${size/2},0 L ${size/2},${size/2} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'quarter2',
        label: 'Quarter 2',
        path: (size) => `M ${size/2},0 L ${size},0 L ${size},${size/2} L ${size/2},${size/2} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'quarter3',
        label: 'Quarter 3',
        path: (size) => `M ${size/2},${size/2} L ${size},${size/2} L ${size},${size} L ${size/2},${size} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'quarter4',
        label: 'Quarter 4',
        path: (size) => `M 0,${size/2} L ${size/2},${size/2} L ${size/2},${size} L 0,${size} Z`,
        defaultColor: '#3B82F6'
      }
    ]
  },
  {
    id: 'pinwheel',
    name: 'Pinwheel',
    category: 'abstract',
    regions: [
      {
        id: 'blade1',
        label: 'Blade 1',
        path: (size) => `M ${size/2},${size/2} L ${size*0.1},0 L ${size*0.9},0 Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'blade2',
        label: 'Blade 2',
        path: (size) => `M ${size/2},${size/2} L ${size},${size*0.1} L ${size},${size*0.9} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'blade3',
        label: 'Blade 3',
        path: (size) => `M ${size/2},${size/2} L ${size*0.9},${size} L ${size*0.1},${size} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'blade4',
        label: 'Blade 4',
        path: (size) => `M ${size/2},${size/2} L 0,${size*0.9} L 0,${size*0.1} Z`,
        defaultColor: '#3B82F6'
      }
    ]
  },
  {
    id: 'cross',
    name: 'Cross Pattern',
    category: 'abstract',
    regions: [
      {
        id: 'center',
        label: 'Center',
        path: (size) => `M ${size*0.35},${size*0.35} L ${size*0.65},${size*0.35} L ${size*0.65},${size*0.65} L ${size*0.35},${size*0.65} Z`,
        defaultColor: '#FFFFFF'
      },
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M ${size*0.35},0 L ${size*0.65},0 L ${size*0.65},${size*0.35} L ${size*0.35},${size*0.35} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'right',
        label: 'Right',
        path: (size) => `M ${size*0.65},${size*0.35} L ${size},${size*0.35} L ${size},${size*0.65} L ${size*0.65},${size*0.65} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M ${size*0.35},${size*0.65} L ${size*0.65},${size*0.65} L ${size*0.65},${size} L ${size*0.35},${size} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'left',
        label: 'Left',
        path: (size) => `M 0,${size*0.35} L ${size*0.35},${size*0.35} L ${size*0.35},${size*0.65} L 0,${size*0.65} Z`,
        defaultColor: '#3B82F6'
      }
    ]
  },
  {
    id: 'rings',
    name: 'Ring Pattern',
    category: 'abstract',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#1E293B'
      },
      {
        id: 'ring1',
        label: 'Ring 1',
        path: (size) => `M ${size/2},${size*0.1} m -${size*0.4},0 a ${size*0.4},${size*0.4} 0 1,0 ${size*0.8},0 a ${size*0.4},${size*0.4} 0 1,0 -${size*0.8},0 Z M ${size/2},${size*0.1} m -${size*0.3},0 a ${size*0.3},${size*0.3} 0 1,1 ${size*0.6},0 a ${size*0.3},${size*0.3} 0 1,1 -${size*0.6},0 Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'ring2',
        label: 'Ring 2',
        path: (size) => `M ${size/2},${size*0.25} m -${size*0.25},0 a ${size*0.25},${size*0.25} 0 1,0 ${size*0.5},0 a ${size*0.25},${size*0.25} 0 1,0 -${size*0.5},0 Z M ${size/2},${size*0.25} m -${size*0.15},0 a ${size*0.15},${size*0.15} 0 1,1 ${size*0.3},0 a ${size*0.15},${size*0.15} 0 1,1 -${size*0.3},0 Z`,
        defaultColor: '#EC4899'
      }
    ]
  },

  // ===更多三角形样式===
  {
    id: 'mountain',
    name: 'Mountain',
    category: 'triangles',
    regions: [
      {
        id: 'sky',
        label: 'Sky',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size*0.3} L ${size/2},${size*0.6} L 0,${size*0.3} Z`,
        defaultColor: '#0EA5E9'
      },
      {
        id: 'mountain1',
        label: 'Mountain 1',
        path: (size) => `M 0,${size*0.3} L ${size*0.3},${size*0.6} L ${size/2},${size*0.3} L ${size*0.7},${size*0.6} L ${size},${size*0.3} L ${size},${size} L 0,${size} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'peak',
        label: 'Peak',
        path: (size) => `M ${size*0.3},${size*0.6} L ${size/2},${size*0.3} L ${size*0.7},${size*0.6} Z`,
        defaultColor: '#FFFFFF'
      }
    ]
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    category: 'modern',
    regions: [
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M 0,0 L ${size/3},${size*0.4} L ${size*2/3},0 L ${size},${size*0.4} L ${size},0 Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'middle',
        label: 'Middle',
        path: (size) => `M 0,0 L 0,${size*0.4} L ${size/3},${size*0.4} L ${size*2/3},0 Z  M ${size*2/3},0 L ${size},${size*0.4} L ${size},0 Z`,
        defaultColor: '#EC4899'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M 0,${size*0.4} L ${size/3},${size*0.4} L 0,${size} Z  M ${size/3},${size*0.4} L ${size*2/3},${size} L 0,${size} Z  M ${size*2/3},${size} L ${size},${size*0.4} L ${size},${size} Z  M ${size*2/3},0 L ${size*2/3},${size} L ${size},${size*0.4} Z`,
        defaultColor: '#8B5CF6'
      }
    ]
  },

  // ===更多现代图案===
  {
    id: 'layers',
    name: 'Layers',
    category: 'modern',
    regions: [
      {
        id: 'layer1',
        label: 'Layer 1',
        path: (size) => `M 0,${size*0.7} L ${size/2},${size*0.4} L ${size},${size*0.7} L ${size},${size} L 0,${size} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'layer2',
        label: 'Layer 2',
        path: (size) => `M ${size*0.1},${size*0.5} L ${size/2},${size*0.25} L ${size*0.9},${size*0.5} L ${size/2},${size*0.4} Z`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'layer3',
        label: 'Layer 3',
        path: (size) => `M ${size*0.2},${size*0.3} L ${size/2},${size*0.1} L ${size*0.8},${size*0.3} L ${size/2},${size*0.25} Z`,
        defaultColor: '#EC4899'
      }
    ]
  },
  {
    id: 'pie-3',
    name: 'Pie Chart 3',
    category: 'abstract',
    regions: [
      {
        id: 'slice1',
        label: 'Slice 1',
        path: (size) => `M ${size/2},${size/2} L ${size/2},0 A ${size/2},${size/2} 0 0,1 ${size},${size/2} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'slice2',
        label: 'Slice 2',
        path: (size) => `M ${size/2},${size/2} L ${size},${size/2} A ${size/2},${size/2} 0 0,1 ${size*0.25},${size*0.933} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'slice3',
        label: 'Slice 3',
        path: (size) => `M ${size/2},${size/2} L ${size*0.25},${size*0.933} A ${size/2},${size/2} 0 0,1 ${size/2},0 Z`,
        defaultColor: '#3B82F6'
      }
    ]
  },
  {
    id: 'pie-4',
    name: 'Pie Chart 4',
    category: 'abstract',
    regions: [
      {
        id: 'slice1',
        label: 'Slice 1',
        path: (size) => `M ${size/2},${size/2} L ${size/2},0 A ${size/2},${size/2} 0 0,1 ${size},${size/2} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'slice2',
        label: 'Slice 2',
        path: (size) => `M ${size/2},${size/2} L ${size},${size/2} A ${size/2},${size/2} 0 0,1 ${size/2},${size} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'slice3',
        label: 'Slice 3',
        path: (size) => `M ${size/2},${size/2} L ${size/2},${size} A ${size/2},${size/2} 0 0,1 0,${size/2} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'slice4',
        label: 'Slice 4',
        path: (size) => `M ${size/2},${size/2} L 0,${size/2} A ${size/2},${size/2} 0 0,1 ${size/2},0 Z`,
        defaultColor: '#3B82F6'
      }
    ]
  },
  
  // ===更多几何===
  {
    id: 'star',
    name: 'Star',
    category: 'geometric',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#1E293B'
      },
      {
        id: 'star',
        label: 'Star',
        path: (size) => {
          const cx = size / 2
          const cy = size / 2
          const outerR = size * 0.4
          const innerR = size * 0.18
          const points = []
          for (let i = 0; i < 10; i++) {
            const angle = (Math.PI / 5) * i - Math.PI / 2
            const r = i % 2 === 0 ? outerR : innerR
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            points.push(`${x},${y}`)
          }
          return `M ${points.join(' L ')} Z`
        },
        defaultColor: '#FBBF24'
      }
    ]
  },
  {
    id: 'octagon',
    name: 'Octagon',
    category: 'geometric',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'octagon',
        label: 'Octagon',
        path: (size) => {
          const offset = size * 0.15
          return `M ${offset},${size*0.1} L ${size - offset},${size*0.1} L ${size*0.9},${offset} L ${size*0.9},${size - offset} L ${size - offset},${size*0.9} L ${offset},${size*0.9} L ${size*0.1},${size - offset} L ${size*0.1},${offset} Z`
        },
        defaultColor: '#FFFFFF'
      }
    ]
  },

  // ===更多条纹===
  {
    id: 'diagonal-stripes-3',
    name: 'Diagonal Stripes 3',
    category: 'stripes',
    regions: [
      {
        id: 'stripe1',
        label: 'Stripe 1',
        path: (size) => `M 0,0 L ${size*0.4},0 L 0,${size*0.4} Z  M ${size*0.4},0 L ${size*0.8},0 L ${size},${size*0.2} L ${size},${size*0.6} L ${size*0.6},${size} L ${size*0.2},${size} L 0,${size*0.8} L 0,${size*0.4} Z`,
        defaultColor: '#EC4899'
      },
      {
        id: 'stripe2',
        label: 'Stripe 2',
        path: (size) => `M ${size*0.8},0 L ${size},0 L ${size},${size*0.2} Z  M ${size},${size*0.6} L ${size},${size} L ${size*0.6},${size} Z  M ${size*0.2},${size} L 0,${size} L 0,${size*0.8} Z`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'stripe3',
        label: 'Stripe 3',
        path: (size) => `M ${size},${size*0.2} L ${size},${size*0.6} L ${size*0.6},${size} L ${size*0.2},${size} L 0,${size*0.8} L 0,${size*0.4} L ${size*0.4},0 L ${size*0.8},0 Z`,
        defaultColor: '#6366F1'
      }
    ]
  },

  // ===更多基础分割===
  {
    id: 'quarter-split',
    name: 'Quarter Split',
    category: 'basic',
    regions: [
      {
        id: 'tl-tr',
        label: 'Top Half',
        path: (size) => `M 0,0 L ${size},0 L ${size/2},${size/2} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'tr-br',
        label: 'Right Half',
        path: (size) => `M ${size},0 L ${size},${size} L ${size/2},${size/2} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'br-bl',
        label: 'Bottom Half',
        path: (size) => `M ${size},${size} L 0,${size} L ${size/2},${size/2} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'bl-tl',
        label: 'Left Half',
        path: (size) => `M 0,${size} L 0,0 L ${size/2},${size/2} Z`,
        defaultColor: '#EC4899'
      }
    ]
  },
  {
    id: 'x-pattern',
    name: 'X Pattern',
    category: 'basic',
    regions: [
      {
        id: 'top',
        label: 'Top',
        path: (size) => `M 0,0 L ${size},0 L ${size/2},${size/2} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'right',
        label: 'Right',
        path: (size) => `M ${size},0 L ${size},${size} L ${size/2},${size/2} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'bottom',
        label: 'Bottom',
        path: (size) => `M ${size},${size} L 0,${size} L ${size/2},${size/2} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'left',
        label: 'Left',
        path: (size) => `M 0,${size} L 0,0 L ${size/2},${size/2} Z`,
        defaultColor: '#EC4899'
      }
    ]
  },

  // ===更多现代图案===
  {
    id: 'pill',
    name: 'Pill Shape',
    category: 'modern',
    regions: [
      {
        id: 'left',
        label: 'Left',
        path: (size) => `M ${size*0.3},${size*0.2} A ${size*0.3},${size*0.3} 0 0,1 ${size*0.3},${size*0.8} L ${size/2},${size*0.8} L ${size/2},${size*0.2} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'right',
        label: 'Right',
        path: (size) => `M ${size/2},${size*0.2} L ${size/2},${size*0.8} L ${size*0.7},${size*0.8} A ${size*0.3},${size*0.3} 0 0,0 ${size*0.7},${size*0.2} Z`,
        defaultColor: '#FBBF24'
      }
    ]
  },
  {
    id: 'rounded-corners',
    name: 'Rounded Corners',
    category: 'modern',
    regions: [
      {
        id: 'center',
        label: 'Center',
        path: (size) => `M ${size*0.3},${size*0.3} L ${size*0.7},${size*0.3} L ${size*0.7},${size*0.7} L ${size*0.3},${size*0.7} Z`,
        defaultColor: '#FFFFFF'
      },
      {
        id: 'corner-tl',
        label: 'Corner TL',
        path: (size) => `M 0,0 L ${size*0.3},0 Q 0,0 0,${size*0.3} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'corner-tr',
        label: 'Corner TR',
        path: (size) => `M ${size*0.7},0 L ${size},0 L ${size},${size*0.3} Q ${size},0 ${size*0.7},0 Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'corner-bl',
        label: 'Corner BL',
        path: (size) => `M 0,${size*0.7} Q 0,${size} ${size*0.3},${size} L 0,${size} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'corner-br',
        label: 'Corner BR',
        path: (size) => `M ${size},${size*0.7} L ${size},${size} L ${size*0.7},${size} Q ${size},${size} ${size},${size*0.7} Z`,
        defaultColor: '#10B981'
      }
    ]
  },
  {
    id: 'frame',
    name: 'Frame Border',
    category: 'geometric',
    regions: [
      {
        id: 'frame',
        label: 'Frame',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z M ${size*0.2},${size*0.2} L ${size*0.2},${size*0.8} L ${size*0.8},${size*0.8} L ${size*0.8},${size*0.2} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'center',
        label: 'Center',
        path: (size) => `M ${size*0.2},${size*0.2} L ${size*0.8},${size*0.2} L ${size*0.8},${size*0.8} L ${size*0.2},${size*0.8} Z`,
        defaultColor: '#FFFFFF'
      }
    ]
  },
  {
    id: 'donut',
    name: 'Donut',
    category: 'geometric',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#1E293B'
      },
      {
        id: 'outer-ring',
        label: 'Outer Ring',
        path: (size) => `M ${size/2},${size*0.05} m -${size*0.45},0 a ${size*0.45},${size*0.45} 0 1,0 ${size*0.9},0 a ${size*0.45},${size*0.45} 0 1,0 -${size*0.9},0 Z M ${size/2},${size*0.2} m -${size*0.3},0 a ${size*0.3},${size*0.3} 0 1,1 ${size*0.6},0 a ${size*0.3},${size*0.3} 0 1,1 -${size*0.6},0 Z`,
        defaultColor: '#EC4899'
      }
    ]
  },
  
  // ===更多抽象===
  {
    id: 'checkboard',
    name: 'Checkerboard',
    category: 'abstract',
    regions: [
      {
        id: 'dark1',
        label: 'Dark 1',
        path: (size) => `M 0,0 L ${size/2},0 L ${size/2},${size/2} L 0,${size/2} Z  M ${size/2},${size/2} L ${size},${size/2} L ${size},${size} L ${size/2},${size} Z`,
        defaultColor: '#1E293B'
      },
      {
        id: 'light1',
        label: 'Light 1',
        path: (size) => `M ${size/2},0 L ${size},0 L ${size},${size/2} L ${size/2},${size/2} Z  M 0,${size/2} L ${size/2},${size/2} L ${size/2},${size} L 0,${size} Z`,
        defaultColor: '#F1F5F9'
      }
    ]
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    category: 'abstract',
    regions: [
      {
        id: 'tile1',
        label: 'Tile 1',
        path: (size) => `M 0,0 L ${size*0.33},0 L ${size*0.33},${size*0.33} L 0,${size*0.33} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'tile2',
        label: 'Tile 2',
        path: (size) => `M ${size*0.33},0 L ${size*0.67},0 L ${size*0.67},${size*0.33} L ${size*0.33},${size*0.33} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'tile3',
        label: 'Tile 3',
        path: (size) => `M ${size*0.67},0 L ${size},0 L ${size},${size*0.33} L ${size*0.67},${size*0.33} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'tile4',
        label: 'Tile 4',
        path: (size) => `M 0,${size*0.33} L ${size*0.33},${size*0.33} L ${size*0.33},${size*0.67} L 0,${size*0.67} Z`,
        defaultColor: '#14B8A6'
      },
      {
        id: 'tile5',
        label: 'Tile 5',
        path: (size) => `M ${size*0.33},${size*0.33} L ${size*0.67},${size*0.33} L ${size*0.67},${size*0.67} L ${size*0.33},${size*0.67} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'tile6',
        label: 'Tile 6',
        path: (size) => `M ${size*0.67},${size*0.33} L ${size},${size*0.33} L ${size},${size*0.67} L ${size*0.67},${size*0.67} Z`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'tile7',
        label: 'Tile 7',
        path: (size) => `M 0,${size*0.67} L ${size*0.33},${size*0.67} L ${size*0.33},${size} L 0,${size} Z`,
        defaultColor: '#EC4899'
      },
      {
        id: 'tile8',
        label: 'Tile 8',
        path: (size) => `M ${size*0.33},${size*0.67} L ${size*0.67},${size*0.67} L ${size*0.67},${size} L ${size*0.33},${size} Z`,
        defaultColor: '#F472B6'
      },
      {
        id: 'tile9',
        label: 'Tile 9',
        path: (size) => `M ${size*0.67},${size*0.67} L ${size},${size*0.67} L ${size},${size} L ${size*0.67},${size} Z`,
        defaultColor: '#6366F1'
      }
    ]
  },
  {
    id: 'pyramid',
    name: 'Pyramid',
    category: 'triangles',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#0EA5E9'
      },
      {
        id: 'left-face',
        label: 'Left Face',
        path: (size) => `M ${size*0.2},${size*0.7} L ${size/2},${size*0.3} L ${size/2},${size*0.85} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'right-face',
        label: 'Right Face',
        path: (size) => `M ${size/2},${size*0.3} L ${size*0.8},${size*0.7} L ${size/2},${size*0.85} Z`,
        defaultColor: '#FBBF24'
      }
    ]
  },
  {
    id: 'ribbons',
    name: 'Ribbons',
    category: 'modern',
    regions: [
      {
        id: 'ribbon1',
        label: 'Ribbon 1',
        path: (size) => `M 0,${size*0.2} L ${size},${size*0.3} L ${size},${size*0.4} L 0,${size*0.3} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'ribbon2',
        label: 'Ribbon 2',
        path: (size) => `M 0,${size*0.45} L ${size},${size*0.55} L ${size},${size*0.65} L 0,${size*0.55} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'ribbon3',
        label: 'Ribbon 3',
        path: (size) => `M 0,${size*0.7} L ${size},${size*0.8} L ${size},${size*0.9} L 0,${size*0.8} Z`,
        defaultColor: '#10B981'
      }
    ]
  },
  {
    id: 'split-circle',
    name: 'Split Circle',
    category: 'geometric',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#1E293B'
      },
      {
        id: 'circle-left',
        label: 'Circle Left',
        path: (size) => `M ${size/2},${size*0.1} A ${size*0.4},${size*0.4} 0 0,1 ${size/2},${size*0.9} L ${size/2},${size*0.1} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'circle-right',
        label: 'Circle Right',
        path: (size) => `M ${size/2},${size*0.1} A ${size*0.4},${size*0.4} 0 0,0 ${size/2},${size*0.9} L ${size/2},${size*0.1} Z`,
        defaultColor: '#EC4899'
      }
    ]
  },
  {
    id: 'arrows',
    name: 'Arrows',
    category: 'modern',
    regions: [
      {
        id: 'arrow-up',
        label: 'Arrow Up',
        path: (size) => `M ${size*0.3},${size*0.35} L ${size/2},${size*0.15} L ${size*0.7},${size*0.35} L ${size*0.6},${size*0.35} L ${size*0.6},${size*0.5} L ${size*0.4},${size*0.5} L ${size*0.4},${size*0.35} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'arrow-down',
        label: 'Arrow Down',
        path: (size) => `M ${size*0.3},${size*0.65} L ${size/2},${size*0.85} L ${size*0.7},${size*0.65} L ${size*0.6},${size*0.65} L ${size*0.6},${size*0.5} L ${size*0.4},${size*0.5} L ${size*0.4},${size*0.65} Z`,
        defaultColor: '#10B981'
      }
    ]
  },
  {
    id: 'burst',
    name: 'Burst',
    category: 'abstract',
    regions: [
      {
        id: 'bg',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#FBBF24'
      },
      {
        id: 'ray1',
        label: 'Ray 1',
        path: (size) => `M ${size/2},${size/2} L ${size*0.45},${size*0.15} L ${size*0.55},${size*0.15} Z`,
        defaultColor: '#FFFFFF'
      },
      {
        id: 'ray2',
        label: 'Ray 2',
        path: (size) => `M ${size/2},${size/2} L ${size*0.85},${size*0.45} L ${size*0.85},${size*0.55} Z`,
        defaultColor: '#FFFFFF'
      },
      {
        id: 'ray3',
        label: 'Ray 3',
        path: (size) => `M ${size/2},${size/2} L ${size*0.55},${size*0.85} L ${size*0.45},${size*0.85} Z`,
        defaultColor: '#FFFFFF'
      },
      {
        id: 'ray4',
        label: 'Ray 4',
        path: (size) => `M ${size/2},${size/2} L ${size*0.15},${size*0.55} L ${size*0.15},${size*0.45} Z`,
        defaultColor: '#FFFFFF'
      }
    ]
  },
  {
    id: 'triangles-pattern',
    name: 'Triangles Pattern',
    category: 'triangles',
    regions: [
      {
        id: 'tri1',
        label: 'Triangle 1',
        path: (size) => `M 0,0 L ${size*0.5},0 L ${size*0.25},${size*0.43} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'tri2',
        label: 'Triangle 2',
        path: (size) => `M ${size*0.5},0 L ${size},0 L ${size*0.75},${size*0.43} Z`,
        defaultColor: '#F59E0B'
      },
      {
        id: 'tri3',
        label: 'Triangle 3',
        path: (size) => `M ${size*0.25},${size*0.43} L ${size*0.75},${size*0.43} L ${size/2},${size*0.86} Z`,
        defaultColor: '#10B981'
      },
      {
        id: 'tri4',
        label: 'Triangle 4',
        path: (size) => `M 0,${size*0.86} L ${size*0.5},${size*0.86} L ${size*0.25},${size} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'tri5',
        label: 'Triangle 5',
        path: (size) => `M ${size*0.5},${size*0.86} L ${size},${size*0.86} L ${size*0.75},${size} Z`,
        defaultColor: '#8B5CF6'
      }
    ]
  },
  {
    id: 'window',
    name: 'Window Panes',
    category: 'basic',
    regions: [
      {
        id: 'pane1',
        label: 'Pane 1',
        path: (size) => `M ${size*0.05},${size*0.05} L ${size*0.475},${size*0.05} L ${size*0.475},${size*0.475} L ${size*0.05},${size*0.475} Z`,
        defaultColor: '#0EA5E9'
      },
      {
        id: 'pane2',
        label: 'Pane 2',
        path: (size) => `M ${size*0.525},${size*0.05} L ${size*0.95},${size*0.05} L ${size*0.95},${size*0.475} L ${size*0.525},${size*0.475} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'pane3',
        label: 'Pane 3',
        path: (size) => `M ${size*0.05},${size*0.525} L ${size*0.475},${size*0.525} L ${size*0.475},${size*0.95} L ${size*0.05},${size*0.95} Z`,
        defaultColor: '#8B5CF6'
      },
      {
        id: 'pane4',
        label: 'Pane 4',
        path: (size) => `M ${size*0.525},${size*0.525} L ${size*0.95},${size*0.525} L ${size*0.95},${size*0.95} L ${size*0.525},${size*0.95} Z`,
        defaultColor: '#EC4899'
      }
    ]
  },
  {
    id: 'l-shape',
    name: 'L Shape',
    category: 'basic',
    regions: [
      {
        id: 'vertical',
        label: 'Vertical',
        path: (size) => `M ${size*0.15},${size*0.15} L ${size*0.45},${size*0.15} L ${size*0.45},${size*0.85} L ${size*0.15},${size*0.85} Z`,
        defaultColor: '#3B82F6'
      },
      {
        id: 'horizontal',
        label: 'Horizontal',
        path: (size) => `M ${size*0.15},${size*0.55} L ${size*0.85},${size*0.55} L ${size*0.85},${size*0.85} L ${size*0.15},${size*0.85} Z`,
        defaultColor: '#10B981'
      }
    ]
  },
  {
    id: 'plus',
    name: 'Plus Sign',
    category: 'geometric',
    regions: [
      {
        id: 'background',
        label: 'Background',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`,
        defaultColor: '#1E293B'
      },
      {
        id: 'plus-v',
        label: 'Vertical',
        path: (size) => `M ${size*0.4},${size*0.1} L ${size*0.6},${size*0.1} L ${size*0.6},${size*0.9} L ${size*0.4},${size*0.9} Z`,
        defaultColor: '#FFFFFF'
      },
      {
        id: 'plus-h',
        label: 'Horizontal',
        path: (size) => `M ${size*0.1},${size*0.4} L ${size*0.9},${size*0.4} L ${size*0.9},${size*0.6} L ${size*0.1},${size*0.6} Z`,
        defaultColor: '#FFFFFF'
      }
    ]
  },
  {
    id: 'brick',
    name: 'Brick Pattern',
    category: 'stripes',
    regions: [
      {
        id: 'row1',
        label: 'Row 1',
        path: (size) => `M 0,0 L ${size},0 L ${size},${size*0.25} L 0,${size*0.25} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'row2-left',
        label: 'Row 2 Left',
        path: (size) => `M 0,${size*0.25} L ${size/2},${size*0.25} L ${size/2},${size*0.5} L 0,${size*0.5} Z`,
        defaultColor: '#DC2626'
      },
      {
        id: 'row2-right',
        label: 'Row 2 Right',
        path: (size) => `M ${size/2},${size*0.25} L ${size},${size*0.25} L ${size},${size*0.5} L ${size/2},${size*0.5} Z`,
        defaultColor: '#F87171'
      },
      {
        id: 'row3',
        label: 'Row 3',
        path: (size) => `M 0,${size*0.5} L ${size},${size*0.5} L ${size},${size*0.75} L 0,${size*0.75} Z`,
        defaultColor: '#EF4444'
      },
      {
        id: 'row4-left',
        label: 'Row 4 Left',
        path: (size) => `M 0,${size*0.75} L ${size/2},${size*0.75} L ${size/2},${size} L 0,${size} Z`,
        defaultColor: '#DC2626'
      },
      {
        id: 'row4-right',
        label: 'Row 4 Right',
        path: (size) => `M ${size/2},${size*0.75} L ${size},${size*0.75} L ${size},${size} L ${size/2},${size} Z`,
        defaultColor: '#F87171'
      }
    ]
  }
]

