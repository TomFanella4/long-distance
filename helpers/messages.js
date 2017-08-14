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

      switch(user.context) {
        case 'name':
          user.significantOther = messageText;
          if (!user.countdownDate) {
            user.context = 'date';
            sendTextMessage(senderID, `Perfect! Next, please enter when you will see ${messageText} again (MM/DD/YYYY)`);
          } else {
            user.context = 'command';
            sendTextMessage(senderID, `Saved ${messageText} <3`);
          }
          user.save();
          break;

        // Check if user has entered a proper countdown date        
        case 'date':
          const newDate = moment(messageText, 'MM-DD-YYYY').utc();
          if (newDate.isValid()) {
            user.countdownDate = newDate.valueOf();
            user.context = 'command';
            user.save();
            sendTextMessage(senderID, `That's closer than you think! I've just subscribed you to recieve spontanious messages! To modify this type help`);
            runCommand(senderID, 's', user);
          } else {
            sendTextMessage(senderID, 'Please enter a valid date');            
          }
          break;

        case 'command':
          runCommand(senderID, messageText, user);
          break;
      }

      
    } else if (messageAttachments) {
      sendTextMessage(senderID, "<3");
    }
  });
}

function runCommand(recipientId, messageText, user) {
  switch (messageText.toLowerCase()) {
    case 'time':
    case 't':
      const timeRemaining = helpers.calculateTimeLeft(user.countdownDate, user.significantOther);
      sendTextMessage(recipientId, timeRemaining);
      break;

    case 'date':
    case 'd':
      user.context = 'date';
      user.save();
      sendTextMessage(recipientId, `Please enter the next date you'll see your significant other`);
      break;

    case 'name':
    case 'n':
      user.context = 'name';
      user.save();
      sendTextMessage(recipientId, 'Please enter the name of your significant other');
      break;

    case 'subscribe':
    case 's':
      if (TIMEOUTS[recipientId]) {
        sendTextMessage(recipientId, 'You already have a subscription');
        break;
      }
      sendMessageAndUpdateTimeout(recipientId, user);
      sendTextMessage(recipientId, 'You have subscribed to recieve messages once a day');
      break;

    case 'unsubscribe':
    case 'u':
      if (TIMEOUTS[recipientId]) {
        clearTimeout(TIMEOUTS[recipientId]);
        TIMEOUTS[recipientId] = null;
        user.nextUpdate = null;
        user.save();

        sendTextMessage(recipientId, 'You have unsubscribed from recieving messages');
      } else {
        sendTextMessage(recipientId, 'You have no current subscriptions');
      }
      break;

    case 'help':
    case 'h':
      sendTextMessage(recipientId, helpers.helpText);
      break;
  
    default:
      sendTextMessage(recipientId, 'Didn\'t quite get that. Try typing help');
      break;
  }
}

function recievedPostback(event) {
  let senderID = event.sender.id;
  console.log(senderID);
  let postback = event.postback;

  switch (postback.payload) {
    case 'GET_STARTED_PAYLOAD':
      // Check if the current user exists 
      // If not, create it
      User.findExistingUserAndCreate(senderID)
      .then(user => {
        if (user.significantOther) {
          sendTextMessage(senderID, `Welcome back ${user.firstName}!`);
        } else {
          sendTextMessage(senderID, `Hello ${user.firstName}! ${helpers.welcomeText}`);
        }
      })
      .catch(error => console.log(error));
      break;
  }
}

function sendMessageAndUpdateTimeout(recipientId, user) {
  const timeRemaining = helpers.calculateTimeLeft(user.countdownDate, user.significantOther);
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
  recievedPostback,
  sendAction,
  sendTextMessage
}
