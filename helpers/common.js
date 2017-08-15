const axios = require('axios');
const moment = require('moment');
const querystring = require('querystring');
require('moment-precise-range-plugin');

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = process.env.MESSENGER_APP_SECRET;

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = process.env.MESSENGER_VALIDATION_TOKEN;

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

const MONGODB_URI = process.env.MONGODB_URI;

// Global map of id -> countdown timeout
const TIMEOUTS = {};

const helpText = `
Here are some useful commands:

time [t] - Check the remaining time until you are together!
date [d] - Change the current countdown date
name [n] - Change the name of your significant other
subscribe [s] - Subscribe to get a notification once a day!
unsubscribe [u] - Unsubscribe from your subscription :(
`;

const welcomeText = `Let's make long distance a little easier! 
But first, please tell me the name of your significant other`

/*
 * Creates a new random date between 8 am and 8 pm of the following day.
 * 
*/
function calculateNextRandomTime(timezone) {
  const randomHour = Math.floor(Math.random() * (20 - 8)) + 8;
  const randomMin  = Math.floor(Math.random() * (59 - 0)) + 0;
  const randomSec  = Math.floor(Math.random() * (59 - 0)) + 0;

  return moment()
  .utcOffset(timezone)
  .add(1, 'days')
  .hours(randomHour)
  .minutes(randomMin)
  .seconds(randomSec);
}

/*
 * Calculate the time from now until the countdown date
 * Note: We can use a generic moment (without timezone)
 * due to how diff algorithm works
 * 
*/
function calculateTimeLeft(countdownDate, significantOther) {
  const diffStr = moment().preciseDiff(countdownDate);
  return `Only ${diffStr} until you are reunited with ${significantOther}!`
}

function getUserInfo(senderID) {
  return new Promise((resolve, reject) => {
    const qs = querystring.stringify({
      fields: 'first_name,last_name,locale,timezone,gender',
      access_token: PAGE_ACCESS_TOKEN
    });
    axios.get(`https://graph.facebook.com/v2.6/${senderID}?${qs}`)
    .then(body => resolve(body.data))
    .catch(error => reject(error));
  });
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  const qs = querystring.stringify({
    access_token: PAGE_ACCESS_TOKEN
  });
  axios.post(`https://graph.facebook.com/v2.10/me/messages?${qs}`, messageData)
  .then(res => {
    let recipientId = res.data.recipient_id;
    let messageId = res.data.message_id;

    if (messageId) {
      console.log("Successfully sent message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
    console.log("Successfully called Send API for recipient %s", 
      recipientId);
    }
  })
  .catch(error => console.error("Failed calling Send API", error))
}

module.exports = {
    APP_SECRET,
    VALIDATION_TOKEN,
    PAGE_ACCESS_TOKEN,
    MONGODB_URI,
    TIMEOUTS,
    helpText,
    welcomeText,
    calculateNextRandomTime,
    calculateTimeLeft,
    getUserInfo,
    callSendAPI
}
