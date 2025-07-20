# 🚀 组件性能优化建议

## 📊 当前状态分析

项目的组件结构已经相当优化，遵循了 Next.js 15 的最佳实践：

✅ **已经做得很好的方面：**
- 正确的 Server/Client Components 分离
- 合理的组件拆分粒度
- 使用 Suspense 进行懒加载
- Portal 渲染优化客户端组件
- 按功能模块组织组件

## 🎯 具体优化建议

### 1. **富文本编辑器组件优化**

**当前问题：**
- `RichTextEditor` 组件较大（295行）
- 工具栏按钮配置可以提取
- 预览功能可以独立

**优化方案：**

```typescript
// 拆分为更小的组件
src/components/ui/rich-text-editor/
├── index.tsx              // 主组件
├── toolbar.tsx           // 工具栏组件
├── preview.tsx           // 预览组件
├── editor-textarea.tsx   // 编辑器文本区域
└── types.ts             // 类型定义
```

### 2. **动态导入优化**

**建议添加动态导入：**

```typescript
// 对于大型组件使用动态导入
const RichTextEditor = dynamic(() => import('@/components/ui/rich-text-editor'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // 如果不需要 SSR
});

const AudioPlayer = dynamic(() => import('@/components/ui/audio-player'), {
  loading: () => <div>Loading audio player...</div>,
});
```

### 3. **React.memo 优化**

**建议对纯展示组件使用 memo：**

```typescript
// 对于频繁重渲染的组件
export default React.memo(function ArticleCard({ article }: ArticleCardProps) {
  // 组件内容
});

// 对于复杂的计算组件
export default React.memo(function TableOfContents({ content }: TOCProps) {
  // 组件内容
}, (prevProps, nextProps) => {
  return prevProps.content === nextProps.content;
});
```

### 4. **Bundle 分析和优化**

**添加 Bundle 分析：**

```bash
# 安装 bundle analyzer
npm install --save-dev @next/bundle-analyzer

# 在 next.config.ts 中配置
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# 运行分析
ANALYZE=true npm run build
```

### 5. **代码分割优化**

**按路由分割：**

```typescript
// 管理员组件懒加载
const AdminLayout = dynamic(() => import('@/components/layout/admin-layout'));
const AdminArticles = dynamic(() => import('@/components/admin/articles'));

// TTS 组件懒加载
const VoiceSettings = dynamic(() => import('@/components/tts/voice-settings'));
const AudioResult = dynamic(() => import('@/components/tts/audio-result'));
```

### 6. **图片优化**

**使用 Next.js Image 组件：**

```typescript
// 确保所有图片都使用 Next.js Image
import Image from 'next/image';

// 添加适当的 sizes 属性
<Image
  src={article.featuredImage}
  alt={article.title}
  width={400}
  height={225}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="w-full h-full object-cover"
/>
```

### 7. **CSS 优化**

**使用 CSS Modules 或 Tailwind 优化：**

```typescript
// 避免内联样式，使用 Tailwind 类
// ❌ 避免
<div style={{ minHeight: '400px' }}>

// ✅ 推荐
<div className="min-h-[400px]">
```

### 8. **状态管理优化**

**使用 useCallback 和 useMemo：**

```typescript
// 对于复杂计算使用 useMemo
const processedArticles = useMemo(() => {
  return articles.filter(article => article.status === 'published')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}, [articles]);

// 对于事件处理函数使用 useCallback
const handleArticleClick = useCallback((slug: string) => {
  router.push(`/articles/${slug}`);
}, [router]);
```

## 📈 性能监控

### 1. **添加性能监控**

```typescript
// 在 _app.tsx 或 layout.tsx 中添加
export function reportWebVitals(metric: NextWebVitalsMetric) {
  console.log(metric);
  // 发送到分析服务
}
```

### 2. **Core Web Vitals 优化**

```typescript
// 预加载关键资源
<link rel="preload" href="/api/articles" as="fetch" crossOrigin="anonymous" />

// 预连接到外部域名
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
```

## 🎯 实施优先级

### 高优先级 (立即实施)
1. ✅ 添加 React.memo 到纯展示组件
2. ✅ 使用动态导入优化大型组件
3. ✅ 确保所有图片使用 Next.js Image

### 中优先级 (下个版本)
1. 🔄 拆分富文本编辑器组件
2. 🔄 添加 Bundle 分析
3. 🔄 优化状态管理

### 低优先级 (长期优化)
1. ⏳ 添加性能监控
2. ⏳ 进一步的代码分割
3. ⏳ CSS 优化

## 📊 预期效果

实施这些优化后，预期可以获得：

- **Bundle 大小减少**: 10-20%
- **首屏加载时间**: 提升 15-25%
- **交互响应时间**: 提升 20-30%
- **Core Web Vitals**: 全面提升

## 🔧 监控工具

建议使用以下工具监控性能：

1. **Next.js Bundle Analyzer** - Bundle 大小分析
2. **Lighthouse** - 性能评分
3. **Web Vitals** - 核心指标监控
4. **React DevTools Profiler** - 组件性能分析

这些优化建议基于当前项目的实际情况，可以根据具体需求和优先级逐步实施。
