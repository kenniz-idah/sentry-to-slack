# 🚀 快速开始指南

## 📋 准备工作

你需要：
- ✅ Vercel 账号（免费）
- ✅ Slack workspace 和创建 App 的权限
- ✅ Sentry 项目

---

## 第一步：获取 Slack 凭证 

### 1.1 创建 Slack App

访问 https://api.slack.com/apps 并点击 **"Create New App"**

选择 **"From scratch"**，输入：
- **App Name**: `Sentry Notifier`（或任意名称）
- **Workspace**: 选择你的 workspace

### 1.2 添加权限

1. 在左侧菜单点击 **"OAuth & Permissions"**
2. 滚动到 **"Scopes"** → **"Bot Token Scopes"**
3. 点击 **"Add an OAuth Scope"** 添加：
   - `chat:write`
   - `chat:write.public`

### 1.3 安装 App

1. 滚动到页面顶部
2. 点击 **"Install to Workspace"**
3. 点击 **"Allow"**
4. **复制** "Bot User OAuth Token"（以 `xoxb-` 开头）
   
### 1.4 获取 Channel ID

1. 打开 Slack，进入你想接收通知的频道
2. 点击频道名称打开详情
3. 滚动到底部，找到 **"Channel ID"**（例如 `C01234567`）
4. **复制** 这个 ID

---

## 第二步：部署到 Vercel

### 选项 A: 使用命令行（推荐）

```bash
# 1. 进入项目目录
cd /Users/kenniz/Projects/sentry-to-slack

# 2. 安装依赖
npm install

# 3. 安装 Vercel CLI（如果还没有安装）
npm install -g vercel

# 4. 登录 Vercel（会打开浏览器）
vercel login

# 5. 部署项目
vercel

# 跟随提示操作：
# - Set up and deploy? → Y
# - Which scope? → 选择你的账号
# - Link to existing project? → N
# - What's your project's name? → sentry-to-slack (或任意名称)
# - In which directory is your code located? → 按回车

# 6. 添加环境变量（替换为你的实际值）
vercel env add SLACK_ACCESS_TOKEN
# 粘贴你的 Slack Bot Token，选择 Production, Preview, Development

vercel env add CHANNEL_ID
# 粘贴你的 Channel ID，选择 Production, Preview, Development

vercel env add SENTRY_CLIENT_SECRET
# 粘贴你的 Sentry Client Secret（可选，用于验证请求），选择 Production, Preview, Development

# 7. 部署到生产环境
vercel --prod
```

部署成功后，你会得到一个 URL，例如：
```
✅ https://sentry-to-slack-abc123.vercel.app
```

你的 webhook URL 是：
```
https://sentry-to-slack-abc123.vercel.app/api/edge
```

### 选项 B: 使用 Vercel Dashboard

1. 访问 https://vercel.com/new
2. 导入你的 Git 仓库（先将代码推送到 GitHub）
3. 点击 **"Environment Variables"**，添加：
   - Name: `SLACK_ACCESS_TOKEN`, Value: 你的 Slack Bot Token
   - Name: `CHANNEL_ID`, Value: 你的 Channel ID
   - Name: `SENTRY_CLIENT_SECRET`, Value: 你的 Sentry Client Secret（可选）
4. 点击 **"Deploy"**
5. 等待部署完成，复制项目 URL

---

## 第三步：配置 Sentry Webhook

### 3.1 创建或使用 Sentry Internal Integration（推荐）

如果你想要签名验证（更安全），建议创建 Internal Integration：

1. 登录 Sentry: https://sentry.io
2. 进入 **Settings** → **Developer Settings** → **Internal Integrations**
3. 点击 **"New Internal Integration"**
4. 填写信息：
   - **Name**: `Slack Notifier`
   - **Webhook URL**: `https://sentry-to-slack-abc123.vercel.app/api/edge`（替换为你的 URL）
   - **Permissions**: 不需要特殊权限
5. 勾选 **Webhooks**，选择你想接收的事件类型：
   - ✅ **issue** - Issue 创建、状态变更
   - ✅ **error** - 新的错误事件
   - ✅ **event_alert** - Issue Alert 触发
   - ✅ **metric_alert** - Metric Alert 触发
6. 点击 **"Save Changes"**
7. **复制 Client Secret**（只显示一次，请保存好）
8. 将 Client Secret 添加到 Vercel：
   ```bash
   vercel env add SENTRY_CLIENT_SECRET
   # 粘贴 Client Secret
   ```
9. 重新部署：
   ```bash
   vercel --prod
   ```

### 3.2 使用 Legacy Webhooks（简单但不安全）

如果你不需要签名验证：

1. 登录 Sentry: https://sentry.io
2. 选择你的项目
3. 进入 **Settings** → **Legacy Integrations**
4. 找到 **"WebHooks"**，点击 **"Add to Project"**
5. 在 **"Callback URLs"** 中填入（替换为你的实际 URL）：
   ```
   https://sentry-to-slack-abc123.vercel.app/api/edge
   ```
6. 勾选你想要接收通知的事件
7. 点击 **"Save Changes"**

> **⚠️ 注意**: Legacy Webhooks 不支持签名验证，任何人知道你的 URL 都可以发送请求。推荐使用 Internal Integration。

---

## 第四步：测试

### 方法 1: 在 Sentry 中触发测试（推荐）

1. 在你的应用中触发一个真实的错误
2. 或在 Sentry 中手动创建一个 Issue
3. 检查你的 Slack 频道是否收到通知

### 方法 2: 在 Sentry 中发送测试 Webhook

如果你使用 Internal Integration：

1. 进入 **Settings** → **Developer Settings** → **Internal Integrations**
2. 点击你创建的集成
3. 在 **Webhooks** 部分，你可以看到最近的 webhook 请求
4. 或者在项目中触发一个真实的错误来测试

### 方法 3: 查看 Vercel 日志

```bash
# 查看实时日志，看是否收到 webhook
vercel logs --follow
```

---

## ✅ 完成！

如果一切正常，你应该在 Slack 频道中看到一条格式化的错误通知！

---

## 🔧 故障排除

### 问题：Slack 没有收到消息

**检查清单：**

1. **确认环境变量设置正确**
   ```bash
   vercel env ls
   ```

2. **检查 Slack Token 权限**
   - 确保添加了 `chat:write` 权限
   - 重新安装 App 到 workspace

3. **查看 Vercel 日志**
   ```bash
   vercel logs --follow
   ```
   或在 Vercel Dashboard → Logs 查看

4. **确认 Channel ID 正确**
   - Channel ID 格式应该是 `C` 开头，例如 `C01234567`
   - 如果 Bot 不在频道中，尝试邀请 Bot 到频道：在 Slack 中输入 `/invite @Sentry Notifier`

### 问题：Vercel 部署失败

1. **确认 Node.js 版本**
   ```bash
   node --version  # 应该是 v16 或更高
   ```

2. **清除缓存重新部署**
   ```bash
   vercel --force
   ```

3. **检查 vercel.json 配置**
   确保文件格式正确（JSON 格式）

### 问题：本地测试无法运行

1. **创建本地环境变量文件**
   
   在项目根目录创建 `.env` 文件（不要提交到 Git）：
   ```env
   SLACK_ACCESS_TOKEN=xoxb-your-token
   CHANNEL_ID=C01234567
   SENTRY_CLIENT_SECRET=your-client-secret-here
   ```

2. **运行本地开发服务器**
   ```bash
   vercel dev
   ```

---

## 📚 下一步

- 📖 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解更多部署选项
- 🔍 阅读 [README.md](./README.md) 了解项目背景
- ⚙️ 自定义 `api/edge.js` 中的消息格式

---

## 💡 提示

- Vercel 免费计划足够大多数小型项目使用
- 每次推送到 Git 主分支会自动触发部署（如果连接了 Git）
- 可以在 Vercel Dashboard 查看部署历史和回滚
- 支持多个环境（Production, Preview, Development）

---

## 🎉 享受免费的 Sentry → Slack 通知！

有问题？查看详细文档或提交 Issue。

