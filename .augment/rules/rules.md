---
type: "always_apply"
---

# Rules

## ✅ 1. Use App Router and Server Components
- 使用 Next.js 15 的 App Router。
- 所有组件默认优先使用服务端组件（Server Component）。
- 仅在明确需要交互（如事件监听、状态）时使用 `use client`。

## ✅ 2. Strong TypeScript Enforcement
- 项目所有代码必须使用 TypeScript，禁止使用 `any`。
- 鼓励使用类型推导、联合类型、映射类型、泛型等进阶用法。

## ✅ 3. Tailwind CSS Only
- 所有样式必须使用 Tailwind CSS。
- 禁止使用 `style` 属性或独立的 CSS 文件，除非引入第三方组件库。

## ✅ 4. Drizzle ORM for All DB Access
- 所有数据库访问必须通过 Drizzle ORM 完成。
- 在复杂聚合、分组统计、性能关键场景下允许直接使用原生 SQL（通过 `sql` 标签或客户端方法）。
- 禁止将聚合逻辑拆成多个查询再在业务层拼接结果。

## ✅ 5. PostgreSQL Compatible Only
- 所有数据库语法必须兼容 PostgreSQL。
- 禁止使用任何 MySQL、SQLite 特定语法。

## ✅ 6. Use Azure Speech SDK for Voice Features
- 所有语音识别、语音合成功能必须使用 Azure Speech AI SDK。
- 禁止使用浏览器原生语音 API 或 Web Speech API。

## ✅ 7. SEO Optimization Priority
- 页面应具备良好 SEO 支持，优先采用静态或服务端渲染。
- 使用 `<head>`、`<meta>`、`<title>`、`<link rel="canonical">` 等组件配置页面元信息。

## ✅ 8. Context7 for Docs, Not Guesswork
- 当不确定库的写法时，优先使用 `use context7` 让 MCP 注入文档上下文。
- 禁止凭空猜测 API 或参数。

## ✅ 9. Don’t Force Build After Code Changes
- 帮我生成代码后不要强制触发构建或执行 `next build`。
- 保持开发流程轻量，优先增量更改。