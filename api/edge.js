// Vercel Serverless Function
// 接收 Sentry webhook 并发送通知到 Slack
// 支持的 webhook 类型: event_alert, metric_alert, issue, error

const crypto = require('crypto');

// 验证 Sentry webhook 签名
function verifySignature(req, secret) {
  if (!secret) {
    console.warn('SENTRY_CLIENT_SECRET not set, skipping signature verification');
    return true;
  }

  const signature = req.headers['sentry-hook-signature'];
  if (!signature) {
    console.warn('No signature found in request headers');
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(req.body), 'utf8');
  const digest = hmac.digest('hex');
  
  return digest === signature;
}

// 发送消息到 Slack
async function sendToSlack(channel, blocks) {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${process.env.SLACK_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        channel,
        blocks,
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }
    
    return data;
  } catch (e) {
    console.error('Error sending message to Slack:', e);
    throw e;
  }
}

// 处理 Issue Alert webhook (event_alert)
function formatIssueAlert(data) {
  const event = data.event;
  const level = event.level || 'error';
  const title = event.title || event.message || 'Unknown Issue';
  const culprit = event.culprit || event.location || 'Unknown';
  const environment = event.environment || 'Unknown';
  const user = event.user?.email || event.user?.ip_address || 'Unknown';
  const webUrl = event.web_url || '';
  const triggeredRule = data.triggered_rule || 'Alert';

  const isError = level === 'error' || level === 'fatal';
  
  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `${isError ? ":red_circle:" : ":warning:"} *${title}*\n_Alert Rule: ${triggeredRule}_`
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": `*Environment:*\n${environment}`
        },
        {
          "type": "mrkdwn",
          "text": `*Level:*\n${level}`
        },
        {
          "type": "mrkdwn",
          "text": `*Culprit:*\n${culprit}`
        },
        {
          "type": "mrkdwn",
          "text": `*User:*\n${user}`
        }
      ]
    },
    {
      "type": "divider"
    },
    ...(webUrl ? [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `<${webUrl}|🔗 View in Sentry>`
      }
    }] : [])
  ];
}

// 处理 Metric Alert webhook (metric_alert)
function formatMetricAlert(data, action) {
  const title = data.description_title || 'Metric Alert';
  const description = data.description_text || '';
  const webUrl = data.web_url || '';
  
  let emoji = ':warning:';
  if (action === 'critical') emoji = ':red_circle:';
  if (action === 'resolved') emoji = ':white_check_mark:';
  
  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `${emoji} *${title}*\n_Status: ${action}_`
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*Description:*\n${description}`
      }
    },
    {
      "type": "divider"
    },
    ...(webUrl ? [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `<${webUrl}|🔗 View in Sentry>`
      }
    }] : [])
  ];
}

// 处理 Issue webhook (issue)
function formatIssue(data, action) {
  const issue = data.issue;
  const title = issue.title || 'Unknown Issue';
  const level = issue.level || 'error';
  const status = issue.status || 'unresolved';
  const culprit = issue.culprit || 'Unknown';
  const project = issue.project?.name || 'Unknown';
  const webUrl = issue.web_url || '';
  const count = issue.count || 0;
  const userCount = issue.userCount || 0;

  let emoji = ':red_circle:';
  if (status === 'resolved') emoji = ':white_check_mark:';
  if (status === 'ignored') emoji = ':no_entry_sign:';
  
  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `${emoji} *${title}*\n_Action: ${action} | Status: ${status}_`
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": `*Project:*\n${project}`
        },
        {
          "type": "mrkdwn",
          "text": `*Level:*\n${level}`
        },
        {
          "type": "mrkdwn",
          "text": `*Events:*\n${count}`
        },
        {
          "type": "mrkdwn",
          "text": `*Users Affected:*\n${userCount}`
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*Culprit:*\n\`${culprit}\``
      }
    },
    {
      "type": "divider"
    },
    ...(webUrl ? [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `<${webUrl}|🔗 View in Sentry>`
      }
    }] : [])
  ];
}

// 处理 Error webhook (error)
function formatError(data) {
  const error = data.error;
  const level = error.level || 'error';
  const title = error.title || error.message || 'Unknown Error';
  const culprit = error.culprit || error.location || 'Unknown';
  const environment = error.contexts?.environment || 'Unknown';
  const user = error.user?.email || error.user?.ip_address || 'Unknown';
  const webUrl = error.web_url || '';
  const exceptionValue = error.exception?.values?.[0]?.value || '';
  const exceptionType = error.exception?.values?.[0]?.type || '';

  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `:red_circle: *${title}*`
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": `*Environment:*\n${environment}`
        },
        {
          "type": "mrkdwn",
          "text": `*Level:*\n${level}`
        },
        {
          "type": "mrkdwn",
          "text": `*Culprit:*\n\`${culprit}\``
        },
        {
          "type": "mrkdwn",
          "text": `*User:*\n${user}`
        }
      ]
    },
    ...(exceptionValue ? [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*${exceptionType}:*\n\`${exceptionValue}\``
      }
    }] : []),
    {
      "type": "divider"
    },
    ...(webUrl ? [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `<${webUrl}|🔗 View in Sentry>`
      }
    }] : [])
  ];
}

// Vercel Serverless Function 主处理函数
module.exports = async (req, res) => {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证签名（如果配置了 SENTRY_CLIENT_SECRET）
    const secret = process.env.SENTRY_CLIENT_SECRET;
    if (secret && !verifySignature(req, secret)) {
      console.error('Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const body = req.body;
    const resource = req.headers['sentry-hook-resource'];
    const action = body.action;
    
    console.log('Received Sentry webhook:', { resource, action });
    
    let blocks;
    
    // 根据 webhook 类型格式化消息
    switch (resource) {
      case 'event_alert':
        blocks = formatIssueAlert(body.data);
        break;
        
      case 'metric_alert':
        blocks = formatMetricAlert(body.data, action);
        break;
        
      case 'issue':
        blocks = formatIssue(body.data, action);
        break;
        
      case 'error':
        blocks = formatError(body.data);
        break;
        
      default:
        console.log('Unsupported webhook type:', resource);
        return res.status(200).json({ 
          success: true, 
          message: `Webhook received but not processed (type: ${resource})` 
        });
    }

    // 发送到 Slack
    await sendToSlack(process.env.CHANNEL_ID, blocks);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Notification sent to Slack',
      resource,
      action
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
