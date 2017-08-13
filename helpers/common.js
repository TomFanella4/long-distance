const axios = require('axios');
const moment = require('moment');
const querystring = require('querystring');
require('moment-precise-range-plugin');

const User = require('./../models/user');

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
`;

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

function getExistingUserAndCreate(senderID) {
  return new Promise((resolve, reject) => {
    User.findOne({id: senderID}).exec()
    .then(user => {
      console.log(user);
      if (!user) {
        getUserInfo(senderID)
        .then(user => {
          let newUser = new User({
            id: senderID,
            context: 'date',
            firstName: user.first_name,
            lastName: user.last_name,
            local: user.locale,
            timezone: user.timezone,
            gender: user.gender
          })
          newUser.save();
          sendTextMessage(senderID, `Hello ${user.first_name} ${user.last_name}!`);
          resolve(newUser);
        })
      } else {
        resolve(user);        
      }
    })
  })
  .catch(error => reject(error));
}

function calculateTimeLeft(countdownDate) {
  let diffStr = moment().preciseDiff(countdownDate);
  return `Only ${diffStr} until you are reunited with your love!`
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page.
 * 
 */
function receivedMessage(event) {
  let senderID = event.sender.id;
  console.log(senderID);
  let recipientID = event.recipient.id;
  let timeOfMessage = event.timestamp;
  let message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
  senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  sendAction(senderID, 'typing_on');

  // Check if the current user exists 
  // If not, create it
  getExistingUserAndCreate(senderID)
  .then(user => {
    // You may get a text or attachment but not both
    let messageText = message.text;
    let messageAttachments = message.attachments;

    if (messageText) {

      // Check if user has entered a proper countdown date
      // TODO: change format
      if (user.context === 'date') {
        let newDate = parseInt(messageText.trim());
        if (!isNaN(newDate)) {
          user.countdownDate = newDate;
          user.context = 'countdown';
          user.save();
          sendTextMessage(senderID, `Successfully saved new countdown date!`);
        } else {
          sendTextMessage(senderID, `Please enter your countdown date`);
        }
        return;
      }

      let timeRemaining = calculateTimeLeft(user.countdownDate);

      switch (messageText.toLowerCase()) {
        case 'time':
        case 't':
          sendTextMessage(senderID, timeRemaining)
          break;

        case 'date':
        case 'd':
          user.context = 'date';
          user.save();
          sendTextMessage(senderID, `Please enter your countdown date`);
          break;

        case 'subscribe':
        case 's':
          if (INTERVALS[senderID]) {
            clearInterval(INTERVALS[senderID]);
          }
          INTERVALS[senderID] = setInterval(senderID => sendTextMessage(senderID, 
            timeRemaining), 86400000, senderID);
          sendTextMessage(senderID, 'You have subscribed to recieve messages once a day');
          sendTextMessage(senderID, timeRemaining)
          break;

        case 'unsubscribe':
        case 'u':
          if (INTERVALS[senderID]) {
            clearInterval(INTERVALS[senderID]);
            sendTextMessage(senderID, 'You have unsubscribed from recieving messages');
          }
          break;

        case 'help':
        case 'h':
          sendTextMessage(senderID, helpText);
          break;
      
        default:
          sendTextMessage(senderID, 'Didn\'t quite get that');
          break;
      }
    } else if (messageAttachments) {
      sendTextMessage(senderID, "<3");
    }
  });
}

function sendAction(recipientId, action) {
  let messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: action
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  let messageData = {
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
    receivedMessage
}
