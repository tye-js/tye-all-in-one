# 🔧 会员升级功能故障排除指南

## 🚨 已发现和修复的问题

### 1. **UI 组件缺失**
- ❌ **问题**: `Module not found: Can't resolve '@/components/ui/alert'`
- ✅ **解决**: 创建了缺失的 UI 组件
  - `src/components/ui/alert.tsx`
  - `src/components/ui/alert-dialog.tsx` (已存在)
  - `src/components/ui/switch.tsx` (已存在)
  - `src/components/ui/separator.tsx` (已存在)

### 2. **NextAuth 会话配置问题**
- ❌ **问题**: 会员字段未包含在用户会话中
- ✅ **解决**: 更新了 NextAuth 配置

#### 修复的文件：
```typescript
// src/lib/auth.ts - 更新了 callbacks
async jwt({ token, user, trigger, session }) {
  if (user) {
    token.membershipTier = user.membershipTier;
    token.membershipExpiresAt = user.membershipExpiresAt;
  }
  
  // 处理会话更新
  if (trigger === 'update' && session) {
    // 重新从数据库获取最新用户信息
  }
}

async session({ session, token }) {
  session.user.membershipTier = token.membershipTier;
  session.user.membershipExpiresAt = token.membershipExpiresAt;
}
```

```typescript
// src/types/next-auth.d.ts - 更新了类型定义
interface Session {
  user: {
    membershipTier?: string;
    membershipExpiresAt?: string;
    // ... 其他字段
  };
}
```

### 3. **登录时用户信息不完整**
- ❌ **问题**: 登录时未获取会员字段
- ✅ **解决**: 更新登录返回的用户信息

```typescript
// 登录时返回完整用户信息
return {
  id: user[0].id,
  email: user[0].email,
  membershipTier: user[0].membershipTier || 'free',
  membershipExpiresAt: user[0].membershipExpiresAt?.toISOString(),
  // ... 其他字段
};
```

## 🔍 诊断步骤

### 1. **检查数据库字段**
运行数据库检查脚本：
```sql
-- 执行 scripts/check-membership-fields.sql
-- 这将检查和创建必要的会员字段
```

### 2. **测试会员升级 API**
使用调试端点测试：
```bash
# 获取当前用户会员信息
GET /api/debug/membership

# 测试升级到 Pro
POST /api/debug/membership
{
  "action": "test-upgrade",
  "targetTier": "pro"
}

# 重置为免费会员
POST /api/debug/membership
{
  "action": "reset-membership"
}
```

### 3. **检查会话信息**
在浏览器控制台中检查：
```javascript
// 检查当前会话
fetch('/api/auth/session')
  .then(res => res.json())
  .then(data => console.log('Session:', data));

// 检查会员信息
fetch('/api/debug/membership')
  .then(res => res.json())
  .then(data => console.log('Membership Debug:', data));
```

## 🚀 测试升级功能

### 完整测试流程：

1. **登录用户账户**
2. **检查初始状态**:
   ```bash
   访问 /api/debug/membership
   确认 membershipTier 为 'free'
   ```

3. **执行升级**:
   - 访问 `/tts` 页面
   - 点击 "Upgrade to Pro" 按钮
   - 选择计划和计费周期
   - 点击 "Upgrade" 按钮

4. **验证升级结果**:
   ```bash
   # 检查数据库更新
   访问 /api/debug/membership
   
   # 检查会话更新
   访问 /api/auth/session
   
   # 检查 UI 更新
   刷新页面，验证 Pro 徽章显示
   验证 SSML Pro 编辑器可用
   ```

## 🔧 常见问题解决

### 问题 1: 升级后仍显示免费会员
**可能原因:**
- 会话未更新
- 数据库更新失败
- NextAuth 配置问题

**解决方案:**
```bash
1. 检查数据库是否更新：
   访问 /api/debug/membership

2. 强制刷新会话：
   登出后重新登录

3. 检查浏览器控制台错误
```

### 问题 2: API 调用失败
**可能原因:**
- 认证失败
- 数据库连接问题
- 字段不存在

**解决方案:**
```bash
1. 检查用户是否已登录
2. 运行数据库迁移脚本
3. 检查服务器日志
```

### 问题 3: UI 组件报错
**可能原因:**
- 缺失 UI 组件
- 导入路径错误

**解决方案:**
```bash
1. 确认所有 UI 组件文件存在
2. 检查导入路径
3. 重启开发服务器
```

## 📋 验证清单

### ✅ 数据库检查
- [ ] `membership_tier` 枚举类型存在
- [ ] `users` 表包含 `membership_tier` 字段
- [ ] `users` 表包含 `membership_expires_at` 字段
- [ ] 索引已创建

### ✅ API 检查
- [ ] `/api/membership/upgrade` 正常工作
- [ ] `/api/debug/membership` 返回正确信息
- [ ] 升级后数据库记录更新

### ✅ 会话检查
- [ ] NextAuth 配置包含会员字段
- [ ] 登录时获取会员信息
- [ ] 会话更新机制工作正常

### ✅ UI 检查
- [ ] 所有 UI 组件正常导入
- [ ] 升级模态框正常显示
- [ ] Pro 功能正确显示/隐藏

## 🎯 预期结果

升级成功后，用户应该看到：

1. **数据库更新**:
   ```sql
   membership_tier = 'pro'
   membership_expires_at = '2024-XX-XX'
   ```

2. **会话更新**:
   ```json
   {
     "user": {
       "membershipTier": "pro",
       "membershipExpiresAt": "2024-XX-XX"
     }
   }
   ```

3. **UI 更新**:
   - Pro 徽章显示
   - SSML Pro 编辑器可用
   - 会员状态组件显示 Pro

## 🆘 如果仍有问题

1. **检查服务器日志** - 查看详细错误信息
2. **运行调试端点** - `/api/debug/membership`
3. **手动数据库查询** - 直接检查用户记录
4. **清除浏览器缓存** - 确保没有缓存问题
5. **重启开发服务器** - 确保所有更改生效

现在会员升级功能应该完全正常工作！🎉
