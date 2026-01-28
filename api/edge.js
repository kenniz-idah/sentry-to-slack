// Vercel Serverless Function
// This function receives Sentry webhook and sends a message to Slack

const sendMessage = async (channel, {level, formatted, environment, email, title, culprit, project}) => {
  console.info({channel, level, formatted, environment, email, title, culprit, project});
  const isError = level === "error";
  
  const blocks = [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `${isError ? ":red_circle:" : ""} *${title}*`
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
          "text": `*Project:*\n${project}`
        }
      ]
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": `*User:*\n${email}`
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*Message:*\n${formatted}`
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*Culprit:*\n${culprit}`
      }
    },
    {
      "type": "divider"
    },
  ];

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
    return data;
  } catch (e) {
    console.error('Error sending message to Slack:', e);
    throw e;
  }
};

// Vercel Serverless Function 处理函数
module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log('Received Sentry webhook:', typeof body);
    
    // Parse Sentry webhook data
    const {
      project,
      culprit,
      event: {
        level,
        logentry: { formatted },
        user: { email },
        environment,
        metadata: { title }
      }
    } = body;

    // Send message to Slack
    await sendMessage(process.env.CHANNEL_ID, {
      level,
      formatted,
      environment,
      email,
      title,
      culprit,
      project
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Notification sent to Slack' 
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};