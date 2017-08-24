const moment = require('moment');
const mongoose = require('mongoose');

const User = require('./../models/user');
const helpers = require('./common');
const strings = require('./strings');

const TIMEOUTS = helpers.TIMEOUTS;

mongoose.connection.once('open', loadIntervalsFromDB);

function loadIntervalsFromDB() {
  User.find().exec()
  .then(users => users.forEach(user => {
    if (user.nextUpdate) {
      updateTimeout(user);
    }
  }))
  .catch(error => console.log(error));
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
  User.findExistingUserAndCreate(senderID)
  .then(user => {
    // You may get a text or attachment but not both
    let messageText = message.text;
    let messageAttachments = message.attachments;

    if (messageText) {
      switch(user.context) {
        case 'start':
          sendTextMessage(senderID, `Hello ${user.firstName}! ${strings.welcomeText1}`);
          user.context = 'name';
          user.save();
          break;

        case 'name':
          user.significantOther = messageText;
          if (!user.countdownDate) {
            user.context = 'date';
            sendTextMessage(senderID, strings.welcomeText2(messageText));
          } else {
            user.context = 'command';
            sendTextMessage(senderID, `Saved ${messageText} <3`);
          }
          user.save();
          break;

        // Check if user has entered a proper countdown date        
        case 'date':
          const newDate = moment(messageText, 'MM-DD-YYYY').utcOffset(user.timezone, true);
          const newDateFormatted = newDate.format('MMMM Do YYYY');
          if (newDate.isValid() && newDate.diff(moment()) >= 0) {
            user.countdownDate = newDate.valueOf();
            user.context = 'command';
            user.save();
            if (user.nextUpdate) {
              sendTextMessage(senderID, strings.successDateText(newDateFormatted));
              break;
            }
            sendTextMessage(senderID, strings.welcomeText3(newDateFormatted));
            runCommand(senderID, 's', user);
          } else {
            sendTextMessage(senderID, strings.errorDateText);            
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
      sendTextMessage(recipientId, strings.inputDateText);
      break;

    case 'name':
    case 'n':
      user.context = 'name';
      user.save();
      sendTextMessage(recipientId, strings.inputNameText);
      break;

    case 'subscribe':
    case 's':
      if (TIMEOUTS[recipientId]) {
        sendTextMessage(recipientId, strings.errorSubscriptionText);
        break;
      }
      sendRemainingAndUpdateTimeout(user);
      sendTextMessage(recipientId, strings.successSubscriptionText);
      break;

    case 'unsubscribe':
    case 'u':
      if (TIMEOUTS[recipientId]) {
        clearTimeout(TIMEOUTS[recipientId]);
        TIMEOUTS[recipientId] = null;
        user.nextUpdate = null;
        user.save();

        sendTextMessage(recipientId, strings.successUnsubscriptionText);
      } else {
        sendTextMessage(recipientId, strings.errrorUnsubscriptionText);
      }
      break;

    case 'help':
    case 'h':
      const countdownDate = moment(user.countdownDate).utcOffset(user.timezone);
      sendTextMessage(recipientId,
        strings.helpText(user.significantOther, countdownDate.format('MMMM Do YYYY')));
      break;
  
    default:
      sendTextMessage(recipientId, strings.errorCommandText);
      break;
  }
}

function receivedPostback(event) {
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
          sendTextMessage(senderID, `Hello ${user.firstName}! ${strings.welcomeText1}`);
          user.context = 'name';
          user.save();
        }
      })
      .catch(error => console.log(error));
      break;
  }
}

function sendRemainingAndUpdateTimeout(user) {
  const timeRemaining = helpers.calculateTimeLeft(user.countdownDate, user.significantOther);
  sendTextMessage(user.id, timeRemaining);
  updateTimeout(user);
}

function updateTimeout(user) {
  const currentDate = moment().utcOffset(user.timezone);

  if (currentDate.isBefore(user.countdownDate)) {
    let nextUpdate = moment(user.nextUpdate);

    if (currentDate.isSameOrAfter(nextUpdate)) {
      nextUpdate = helpers.calculateNextRandomTime(user.timezone);
    }

    const msToUpdate = nextUpdate.diff(currentDate);
    TIMEOUTS[user.id] = setTimeout(sendRemainingAndUpdateTimeout, msToUpdate, user);
    user.nextUpdate = nextUpdate.valueOf();
  } else {
    sendTextMessage(user.id, strings.endingText(user.significantOther));
    user.nextUpdate = null;
    user.context = 'date';
  }
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
  receivedPostback,
  sendAction,
  sendTextMessage
}
