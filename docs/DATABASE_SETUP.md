# 数据库设置指南

本文档介绍如何设置和配置项目的 PostgreSQL 数据库。

## 📋 前提条件

1. **PostgreSQL 数据库服务器**
   - 确保 PostgreSQL 服务正在运行
   - 创建数据库 `all_in_one`
   - 确保用户 `tianye` 有访问权限

2. **环境变量配置**
   - 确保 `.env.local` 文件存在并包含正确的数据库连接信息

## 🚀 快速设置

### 方法 1：一键设置（推荐）
```bash
npm run db:reset
```

这个命令会：
- 创建所有数据库表
- 插入初始数据（管理员用户、分类、标签）

### 方法 2：分步设置
```bash
# 1. 创建数据库表
npm run db:setup

# 2. 插入初始数据
npm run db:seed-custom
```

## 📊 数据库结构

设置完成后，将创建以下表：

### 核心表
- **users** - 用户表
- **categories** - 文章分类表
- **tags** - 标签表
- **articles** - 文章表
- **article_tags** - 文章标签关联表

### 功能表
- **tts_requests** - TTS 请求记录表
- **media_files** - 媒体文件表

## 👤 默认管理员账户

设置完成后，会创建一个默认管理员账户：

- **邮箱**: `admin@example.com`
- **密码**: `admin123`
- **角色**: 管理员

> ⚠️ **安全提醒**: 请在生产环境中修改默认密码！

## 📁 默认分类

系统会创建以下默认分类：

1. **Server Deals** (`server-deals`) - 服务器优惠信息
2. **AI Tools** (`ai-tools`) - AI 工具相关
3. **General** (`general`) - 通用文章

## 🏷️ 默认标签

系统会创建以下默认标签：

- VPS, Dedicated Server, Cloud Hosting
- AI, Machine Learning, ChatGPT, OpenAI
- News, Tutorial, Review

## 🔧 数据库管理命令

```bash
# 生成迁移文件
npm run db:generate

# 查看数据库（Drizzle Studio）
npm run db:studio

# 重新设置数据库
npm run db:reset
```

## 🌐 访问应用

设置完成后，启动开发服务器：

```bash
npm run dev
```

然后访问：
- **前端**: http://localhost:3000
- **管理后台**: http://localhost:3000/admin
- **登录页面**: http://localhost:3000/auth/signin

## 🔍 故障排除

### 连接错误
如果遇到数据库连接错误：

1. 检查 PostgreSQL 服务是否运行
2. 验证 `.env.local` 中的 `DATABASE_URL` 是否正确
3. 确认数据库 `all_in_one` 已创建
4. 检查用户权限

### 表已存在错误
如果看到 "already exists" 错误，这是正常的，脚本会自动跳过已存在的表。

### 权限错误
确保数据库用户有以下权限：
- CREATE (创建表)
- INSERT (插入数据)
- SELECT (查询数据)
- UPDATE (更新数据)
- DELETE (删除数据)

## 📝 环境变量示例

`.env.local` 文件应包含：

```env
# Database
DATABASE_URL="postgresql://tianye:your_password@localhost:5432/all_in_one"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Admin Configuration
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

## 🎯 下一步

数据库设置完成后，您可以：

1. 启动开发服务器：`npm run dev`
2. 访问管理后台创建内容
3. 测试 TTS 功能
4. 上传媒体文件
5. 开始开发您的功能

---

如果遇到任何问题，请检查控制台输出的错误信息，或查看 Next.js 开发服务器的日志。
