require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');


const targetUrl = process.env.TARGET_URL;
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const cronTime = process.env.CRON_TIME || '*/5 * * * *';

// Health check function
const performHealthCheck = async () => {
  try {
    const response = await axios.get(targetUrl);
    if (response.status === 200) {
      console.log(`Health check for ${targetUrl} passed successfully.`);
    } else {
      throw new Error(`${response.status}`);
    }
  } catch (error) {
    console.error('Error during health check:', error.message);
    sendSlackNotification(`Server is down! Health check for ${targetUrl} failed ${error.message}`);
  }
};

// Slack notification function
const sendSlackNotification = async (message) => {
  try {
    await axios.post(slackWebhookUrl, { text: message });
  } catch (error) {
    console.error('Error sending Slack notification:', error.message);
  }
};

// Schedule health check every 5 minutes (adjust as needed)
cron.schedule(cronTime, () => {
  console.log('Running health check...');
  performHealthCheck();
});