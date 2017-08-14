const moment = require('moment');

const User = require('./../models/user');
const helpers = require('./common');

const TIMEOUTS = {};

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
  User.findExistingUserAndCreate(senderID)
  .then(user => {
    // You may get a text or attachment but not both
    let messageText = message.text;
    let messageAttachments = message.attachments;

    if (messageText) {

      // Check if user has entered a proper countdown date
      if (user.context === 'date') {
        const newDate = moment(messageText, 'MM-DD-YYYY').utc();
        if (newDate.isValid()) {
          user.countdownDate = newDate.valueOf();
          user.context = 'countdown';
          user.save();
          sendTextMessage(senderID, `Successfully saved new countdown date!`);
        } else {
          const message = user.countdownDate ? 'Please enter your countdown date' :
            `Hello ${user.firstName} ${user.lastName}!\nPlease enter your countdown date`

          sendTextMessage(senderID, message);            
        }
        return;
      }

      switch (messageText.toLowerCase()) {
        case 'time':
        case 't':
          const timeRemaining = helpers.calculateTimeLeft(user.countdownDate);
          sendTextMessage(senderID, timeRemaining);
          break;

        case 'date':
        case 'd':
          user.context = 'date';
          user.save();
          sendTextMessage(senderID, `Please enter your countdown date`);
          break;

        case 'subscribe':
        case 's':
          if (TIMEOUTS[senderID]) {
            sendTextMessage(senderID, 'You already have a subscription');
            break;
          }
          sendMessageAndUpdateTimeout(senderID, user);
          sendTextMessage(senderID, 'You have subscribed to recieve messages once a day');
          break;

        case 'unsubscribe':
        case 'u':
          if (TIMEOUTS[senderID]) {
            clearTimeout(TIMEOUTS[senderID]);
            TIMEOUTS[senderID] = null;
            user.nextUpdate = null;
            user.save();

            sendTextMessage(senderID, 'You have unsubscribed from recieving messages');
          } else {
            sendTextMessage(senderID, 'You have no current subscriptions');
          }
          break;

        case 'help':
        case 'h':
          sendTextMessage(senderID, helpers.helpText);
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

function sendMessageAndUpdateTimeout(recipientId, user) {
  const timeRemaining = helpers.calculateTimeLeft(user.countdownDate);
  sendTextMessage(recipientId, timeRemaining);
  
  const nextUpdate = helpers.calculateNextRandomTime();
  const msToUpdate = nextUpdate.diff(moment());

  TIMEOUTS[recipientId] = setTimeout(sendMessageAndUpdateTimeout, msToUpdate, recipientId, user);

  user.nextUpdate = nextUpdate.valueOf();
  user.save();
}

/*
 * Send an action using the Send API.
 *
 */
function sendAction(recipientId, action) {
  let messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: action
  };

  helpers.callSendAPI(messageData);
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

  helpers.callSendAPI(messageData);
}

module.exports = {
  receivedMessage,
  sendAction,
  sendTextMessage
}
