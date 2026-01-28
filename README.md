# **Say Goodbye to Paid Sentry Alerts: Get Slack Error Notifications for Free!**

Are you tired of paying for Sentry's Slack integration? What if I told you there's a way to send error notifications to Slack *for free*? That's right—no more paying for what you can do with a few simple tricks. By leveraging Sentry's webhook, Vercel's **Serverless Functions**, and Slack's free API, you can set up a system that gets real-time error alerts sent straight to Slack without shelling out a dime. Intrigued? Let me show you how.

> **📢 更新说明 (2026):** 本项目已从 Edge Functions 迁移到 Vercel Serverless Functions，这是目前推荐的部署方式。

## Why Pay for Something You Can Do for Free?

Sentry offers a built-in integration with Slack, but it’s locked behind a paywall. For smaller projects or indie developers, that’s just not worth it. Luckily, we can bypass this by creating a webhook listener on Vercel that formats error notifications and sends them to Slack via the free Slack API.

Ready to ditch the paid plans? Let’s dive in.

## Step 1: Configuring the Sentry Webhook (No, It’s Not Hard)

Sentry provides a webhook legacy integration that lets you send error events to external services. Here’s how you hook that up to a free Vercel edge function:

1. **Open Your Sentry Project**: Head to your project settings in Sentry.
2. **Enable Webhooks**: Under **Legacy Integrations**, add a new webhook. This is where Sentry will send error data.
3. **Point It to Vercel**: Once we set up our Vercel function, you’ll use that URL here. But first, let’s get the listener set up.

## Step 2: Vercel Serverless Function—The Magic Sauce

If you're new to Vercel, it's a serverless platform that allows you to run code in the cloud for free (within certain limits). We're going to deploy a serverless function that will listen for Sentry events, format them, and send them to Slack. This repo contains all the code you need.

### What This Code Does:

- **Receives Sentry Webhooks**: The function is triggered when Sentry sends a webhook.
- **Supports Multiple Webhook Types**:
  - 🔔 **Issue Alerts** (`event_alert`) - When an alert rule is triggered
  - 📊 **Metric Alerts** (`metric_alert`) - Performance and error rate alerts
  - 🐛 **Issues** (`issue`) - Issue state changes (created, resolved, assigned, etc.)
  - ❌ **Errors** (`error`) - Individual error events
- **Verifies Signatures**: Optional signature verification using Sentry Client Secret for security
- **Formats the Message**: It parses the webhook and formats a Slack message using blocks (the fancy Slack message formatting system).
- **Sends It to Slack**: Using Slack's API, it posts the notification to a channel of your choice.

### Step 3: Slack Setup—Let the Notifications Begin

Here’s how you make sure Slack gets the error alerts:

1. **Create a Slack App**: Visit [api.slack.com/apps](https://api.slack.com/apps) and create a new app in your workspace.
2. **Permissions**: Under **OAuth & Permissions**, add the `chat:write` permission.
3. **Install the App**: Grab the OAuth token after installing the app to your workspace.
4. **Environment Variables**: Set these environment variables in Vercel:
   - `SLACK_ACCESS_TOKEN` - Your Slack Bot Token (required)
   - `CHANNEL_ID` - Your Slack Channel ID (required)
   - `SENTRY_CLIENT_SECRET` - Your Sentry Client Secret (optional, but recommended for security)

### Step 4: Deploy the Function to Vercel

有两种部署方式：

#### 方式一：使用 Vercel CLI（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 安装 Vercel CLI（如果还没有）
npm install -g vercel

# 3. 登录 Vercel
vercel login

# 4. 部署到预览环境
vercel

# 5. 添加环境变量
vercel env add SLACK_ACCESS_TOKEN
vercel env add CHANNEL_ID
vercel env add SENTRY_CLIENT_SECRET  # 可选，但推荐

# 6. 部署到生产环境
vercel --prod
```

#### 方式二：使用 GitHub + Vercel Dashboard

1. 将代码推送到 GitHub 仓库
2. 在 [vercel.com](https://vercel.com) 导入你的项目
3. 在 Vercel Dashboard 的 Settings → Environment Variables 中添加：
   - `SLACK_ACCESS_TOKEN`
   - `CHANNEL_ID`
   - `SENTRY_CLIENT_SECRET` (可选，推荐)
4. 点击 Deploy

**📖 详细的部署指南请查看 [QUICKSTART.md](./QUICKSTART.md)**

Now, when an error happens in Sentry, it will trigger your serverless function, and you'll see those notifications in Slack within seconds!

## Step 5: Testing the Integration

To test if everything’s working, trigger an error in your Sentry project. Check your Slack channel for the notification! If it worked, you should see a neatly formatted message with all the error details.

## Why This is Awesome

- **It’s Free**: No more paying for Sentry’s Slack integration.
- **Real-Time Alerts**: Get instant error notifications as soon as they happen.
- **Customizable**: You control how the Slack messages look and what data they contain.
- **No Maintenance**: Vercel’s serverless functions handle everything with almost no setup costs.
