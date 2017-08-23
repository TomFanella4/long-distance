const emoji = require('node-emoji');

const heart = emoji.get('heart');
const brokenHeart = emoji.get('broken_heart');
const calendar = emoji.get('calendar');
const heartEyes = emoji.get('heart_eyes');
const thumbsUp = emoji.get('thumbsup');
const cry = emoji.get('cry');
const blush = emoji.get('blush');

module.exports = {
  helpText: (significantOther, countdownDate) => `
Currently saved information:

Significant Other: ${significantOther}
Countdown Date: ${countdownDate}

Here are some useful commands:

time [t]: Check the remaining time until you see ${significantOther} ${heart}
date [d]: Change the current countdown date ${calendar}
name [n]: Change the name of your significant other ${brokenHeart}
subscribe [s]: Subscribe to get a notification once a day ${heartEyes}
unsubscribe [u]: Unsubscribe from your subscription ${cry}`,
  welcomeText1: `Let's make long distance a little easier! But first, please tell me the name of your significant other ${heart}`,
  welcomeText2: messageText => `Perfect! Now, please enter the next date you'll see ${messageText} ${heart}`,
  welcomeText3: countdownDate => `${countdownDate} is closer than you think! For more commands try typing "help"`,
  timeRemainingText: (diffStr, significantOther) => `${heart} Only ${diffStr} until you are reunited with ${significantOther}! ${heart}`,
  endingText: significantOther => `${heart} ${heart} ${heart} Finally you are reunited with ${significantOther}! I hope your use of the Long Distance bot has helped with your separation ${blush} You will no longer receive messages, but if you are continuing long distance please enter a new date when you're ready. ${heart} ${heart} ${heart}`,
  inputDateText: `Please enter the next date you'll see your significant other ${heart}`,
  inputNameText: `Please enter the name of your significant other ${heart}`,
  successDateText: date => `Saved ${date} ${calendar}`,
  successSubscriptionText: `You have subscribed to receive a spontaneous reminder once a day ${heartEyes}`,
  successUnsubscriptionText: `You have unsubscribed from recieving messages ${cry}`,
  errorDateText: `Please enter a valid future date MM/DD/YYYY ${calendar}`,
  errorSubscriptionText: `You already have a subscription ${thumbsUp}`,
  errrorUnsubscriptionText: `You have no current subscriptions. Try typing "subscribe" ${thumbsUp}`,
  errorCommandText: `Didn't quite get that. Try typing "help"`,
}
