require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');

const targetUrl = process.env.TARGET_URL;
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const cronTime = process.env.CRON_TIME || '*/5 * * * *';
let lastError = {};
let isRunning = false;

const ignoreError = ['EAI_AGAIN'];

// Health check function
const performHealthCheck = async () => {
  isRunning = true;
  try {
    const response = await axios.get(targetUrl);
    if (response.status === 200) {
      lastError = {};
      console.log(`Health check for ${targetUrl} passed successfully.`);
    } else {
      throw new Error(`${response.status}`);
    }
  } catch (error) {
    console.error('Error during health check:', error.message);
    if (ignoreError.every((x) => !error.message?.includes(x))) {
      sendSlackNotification(
        `Server is down! Health check for ${targetUrl} failed ${error.message}`,
      );
    }
  }
  isRunning = false
};

// Slack notification function
const sendSlackNotification = async (message) => {
  try {
    if (!lastError[message]) {
      lastError[message] = Date.now();
      return await axios.post(slackWebhookUrl, { text: message });
    }
    if (lastError[message] + 300000 < Date.now()) {
      lastError[message] = Date.now();
      return await axios.post(slackWebhookUrl, { text: message + "(Issue Haven't Fixed Yet!)" });
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error.message);
  }
};

// Schedule health check every 5 minutes (adjust as needed)
cron.schedule(cronTime, () => {
  console.log('Running health check... ! Is running:'+ isRunning);
  if(!isRunning) performHealthCheck();
});
