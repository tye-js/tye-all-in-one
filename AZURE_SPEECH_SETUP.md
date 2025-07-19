# 🎤 Azure Speech Service 配置指南

## 🚨 当前问题

你遇到的 `401 Unauthorized` 错误表明 Azure Speech Service 的认证配置有问题。

## 🔧 解决步骤

### 1. **获取 Azure Speech Service 凭据**

#### 方法一：使用现有资源
1. 登录 [Azure Portal](https://portal.azure.com)
2. 搜索并进入你的 "Speech Service" 资源
3. 在左侧菜单中点击 "Keys and Endpoint"
4. 复制 **Key 1** 和 **Region**

#### 方法二：创建新资源
1. 登录 [Azure Portal](https://portal.azure.com)
2. 点击 "Create a resource"
3. 搜索 "Speech"，选择 "Speech"
4. 填写以下信息：
   - **Subscription**: 选择你的订阅
   - **Resource group**: 选择或创建资源组
   - **Region**: 选择离你最近的区域（如 `eastus`, `westus2`）
   - **Name**: 给资源起个名字
   - **Pricing tier**: 选择 `F0` (免费) 或 `S0` (标准)
5. 点击 "Review + create"，然后 "Create"
6. 创建完成后，进入资源，复制 **Key** 和 **Region**

### 2. **配置环境变量**

在项目根目录的 `.env.local` 文件中添加：

```env
# Azure Speech Service 配置
AZURE_SPEECH_KEY=your_subscription_key_here
AZURE_SPEECH_REGION=your_region_here
```

**示例：**
```env
AZURE_SPEECH_KEY=1234567890abcdef1234567890abcdef
AZURE_SPEECH_REGION=eastus
```

### 3. **常用区域代码**

| 区域代码 | 区域名称 | 位置 |
|---------|---------|------|
| `eastus` | East US | 美国东部 |
| `westus2` | West US 2 | 美国西部2 |
| `westeurope` | West Europe | 西欧 |
| `southeastasia` | Southeast Asia | 东南亚 |
| `japaneast` | Japan East | 日本东部 |
| `australiaeast` | Australia East | 澳大利亚东部 |

### 4. **重启开发服务器**

配置环境变量后，重启你的开发服务器：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

### 5. **验证配置**

访问管理页面查看 Azure 配置状态：
- 如果你有管理员权限，可以在管理面板中查看 Azure 状态
- 或者检查控制台日志，应该看到 `✅ Azure Speech Service configured for region: your_region`

## 🔍 故障排除

### 问题 1: 仍然显示 401 错误
**可能原因：**
- 密钥错误或已过期
- 区域代码不正确
- 资源被暂停或删除

**解决方案：**
1. 重新检查 Azure Portal 中的密钥和区域
2. 确保复制的密钥没有多余的空格
3. 尝试使用 Key 2 而不是 Key 1
4. 检查 Azure 资源是否处于活动状态

### 问题 2: 403 Forbidden 错误
**可能原因：**
- 订阅配额已用完
- 资源被限制访问

**解决方案：**
1. 检查 Azure Portal 中的配额使用情况
2. 确保订阅处于活动状态
3. 检查是否有地理位置限制

### 问题 3: 404 Not Found 错误
**可能原因：**
- 区域代码错误
- 服务在该区域不可用

**解决方案：**
1. 检查区域代码是否正确
2. 尝试使用其他区域
3. 确认 Speech Service 在该区域可用

## 🎯 临时解决方案

如果暂时无法配置 Azure，系统会自动使用内置的回退语音数据，包括：

- **中文**: 晓晓 (XiaoxiaoNeural), 云希 (YunxiNeural)
- **英文**: Jenny (JennyNeural), Guy (GuyNeural)  
- **日文**: 七海 (NanamiNeural), 圭太 (KeitaNeural)

这些回退语音足以进行基本的 TTS 功能测试。

## 📞 获取帮助

如果仍然遇到问题：

1. **检查 Azure 服务状态**: [Azure Status](https://status.azure.com/)
2. **查看 Azure 文档**: [Speech Service Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
3. **联系 Azure 支持**: 通过 Azure Portal 提交支持票据

## ✅ 配置成功标志

配置成功后，你应该看到：

```
✅ Azure Speech Service configured for region: eastus
🔄 Fetching voices from Azure region: eastus
✅ Fetched 400+ voices from Azure
✅ Voice synchronization completed: added X, updated Y, total Z
```

而不是：

```
❌ Azure API error: 401 Unauthorized
🔄 Falling back to default voices...
```
