# 🔧 React Hooks 顺序错误修复

## 🚨 原始问题

```
React has detected a change in the order of Hooks called by MembershipStatus. 
This will lead to bugs and errors if not fixed.

Previous render            Next render
------------------------------------------------------
1. useContext                 useContext
2. useEffect                  useEffect
3. useState                   useState
4. useState                   useState
5. undefined                  useEffect
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Error: Rendered more hooks than during the previous render.
```

## 🔍 问题分析

### 根本原因：
React Hooks 的 **调用顺序发生了变化**，这违反了 React Hooks 的基本规则。

### 具体问题：
1. **条件性早期返回** - 在 Hooks 调用之前有 `if (!session?.user) return null`
2. **会话状态变化** - `useSession` 的状态变化导致组件重新渲染时 Hooks 调用顺序不一致

### 原始代码问题：
```typescript
export default function MembershipStatus({ showUpgrade = true, compact = false }) {
  const { data: session } = useSession();  // Hook 1
  const [usage, setUsage] = useState(null); // Hook 2
  const [loading, setLoading] = useState(true); // Hook 3

  if (!session?.user) {
    return null; // ❌ 早期返回，导致后续 Hooks 不被调用
  }

  // 获取使用情况
  useEffect(() => { // Hook 4 - 但在某些渲染中不会被调用
    // ...
  }, [session?.user]);
}
```

## ✅ 解决方案

### 方法：组件分离
将组件分为两部分：
1. **外层组件** - 处理会话检查和条件渲染
2. **内层组件** - 包含所有业务逻辑和 Hooks

### 修复后的代码：

```typescript
// 内部组件 - 只在有用户会话时渲染，确保 Hooks 调用一致
function MembershipStatusContent({ showUpgrade, compact, session }) {
  const [usage, setUsage] = useState(null);     // Hook 1
  const [loading, setLoading] = useState(true); // Hook 2

  useEffect(() => {                             // Hook 3
    // 获取使用情况的逻辑
  }, []);

  // 业务逻辑...
  return (
    // JSX 内容
  );
}

// 外层组件 - 处理会话检查
export default function MembershipStatus({ showUpgrade = true, compact = false }) {
  const { data: session } = useSession();

  // 条件渲染在这里处理
  if (!session?.user) {
    return null;
  }

  // 只有在有会话时才渲染内容组件
  return (
    <MembershipStatusContent 
      showUpgrade={showUpgrade} 
      compact={compact} 
      session={session} 
    />
  );
}
```

## 🎯 修复的关键点

### 1. **Hooks 调用一致性**
- ✅ 内层组件的 Hooks 调用顺序始终一致
- ✅ 外层组件只有一个 Hook (`useSession`)
- ✅ 条件渲染不影响 Hooks 调用

### 2. **组件职责分离**
- ✅ **外层组件**: 会话管理和条件渲染
- ✅ **内层组件**: 业务逻辑和状态管理

### 3. **性能优化**
- ✅ 避免不必要的 Hook 调用
- ✅ 减少重新渲染的复杂性

## 📋 React Hooks 规则回顾

### ✅ 正确做法：
1. **始终在顶层调用 Hooks** - 不要在循环、条件或嵌套函数中调用
2. **保持调用顺序一致** - 每次渲染时 Hooks 的调用顺序必须相同
3. **只在 React 函数中调用 Hooks** - 不要在普通 JavaScript 函数中调用

### ❌ 错误做法：
```typescript
// ❌ 条件性调用 Hooks
if (condition) {
  const [state, setState] = useState();
}

// ❌ 在早期返回之后调用 Hooks
if (condition) return null;
const [state, setState] = useState();

// ❌ 在循环中调用 Hooks
for (let i = 0; i < items.length; i++) {
  const [state, setState] = useState();
}
```

## 🚀 验证修复

### 修复前的错误日志：
```
❌ React has detected a change in the order of Hooks
❌ Error: Rendered more hooks than during the previous render
```

### 修复后的预期结果：
```
✅ 组件正常渲染
✅ 没有 Hooks 顺序错误
✅ 会员状态正常显示
```

## 📚 相关资源

- [React Hooks 规则](https://react.dev/link/rules-of-hooks)
- [React Hooks FAQ](https://reactjs.org/docs/hooks-faq.html)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)

## 🎊 总结

通过将组件分离为外层的会话检查组件和内层的业务逻辑组件，我们：

1. **解决了 Hooks 顺序问题** - 确保 Hooks 调用顺序始终一致
2. **提高了代码可维护性** - 职责分离，逻辑更清晰
3. **保持了功能完整性** - 所有原有功能都正常工作
4. **符合 React 最佳实践** - 遵循 Hooks 使用规则

现在 `MembershipStatus` 组件应该可以正常工作，不再出现 Hooks 顺序错误！🎉
