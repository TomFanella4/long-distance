const request = require('request');
const moment = require('moment');
require('moment-precise-range-plugin');

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = process.env.MESSENGER_APP_SECRET;

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = process.env.MESSENGER_VALIDATION_TOKEN;

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN;

// Temporary global countdown date and list of intervals
const COUNTDOWN_DATE = '2017-10-07 00:00:00-05:00';
const INTERVALS = {};

const helpText = `
Welcome to the Reminder Bot! This bot will help remind you when we will be together again! <3

Commands: 
time (t) - Check the remaining time until we are together!
subscribe (s) - Subscribe to get a notification once a day!
unsubscribe (u) - Unsubscribe from your subscription :(
`

function calculateTimeLeft() {
  let diffStr = moment().preciseDiff(COUNTDOWN_DATE);
  return `Only ${diffStr} until we are together again! <3 Tom`
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page.
 * 
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  console.log(senderID);
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    switch (messageText.toLowerCase()) {
      case 'time':
      case 't':
        sendTextMessage(senderID, calculateTimeLeft())
        break;

      case 'subscribe':
      case 's':
        if (INTERVALS[senderID]) {
          clearInterval(INTERVALS[senderID]);
        }
        INTERVALS[senderID] = setInterval(senderID => sendTextMessage(senderID, 
          calculateTimeLeft()), 86400000, senderID);
        sendTextMessage(senderID, 'You have subscribed to recieve messages once a day');
        sendTextMessage(senderID, calculateTimeLeft())
        break;

      case 'unsubscribe':
      case 'u':
        if (INTERVALS[senderID]) {
          clearInterval(INTERVALS[senderID]);
          sendTextMessage(senderID, 'You have unsubscribed from recieving messages');
        }
        break;
    
      default:
        sendTextMessage(senderID, helpText);
        break;
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.10/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });  
}

module.exports = {
    APP_SECRET,
    VALIDATION_TOKEN,
    PAGE_ACCESS_TOKEN,
    receivedMessage
}
