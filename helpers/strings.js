module.exports = {
  helpText: (significantOther, countdownDate) => `
Currently saved information:

Significant Other: ${significantOther}
Countdown Date: ${countdownDate}

Here are some useful commands:

time [t]: Check the remaining time until you see ${significantOther} <3
date [d]: Change the current countdown date 📆
name [n]: Change the name of your significant other 💔
subscribe [s]: Subscribe to get a notification once a day 😍
unsubscribe [u]: Unsubscribe from your subscription :(`,
  welcomeText1: 'Let\'s make long distance a little easier! But first, please tell me the name of your significant other <3',
  welcomeText2: messageText => `Perfect! Now, please enter the next date you\'ll see ${messageText} <3`,
  welcomeText3: 'That\'s closer than you think! I\'ve just subscribed you to recieve spontanious messages! For more commands try typing "help"',
  timeRemainingText: (diffStr, significantOther) => `<3 Only ${diffStr} until you are reunited with ${significantOther}! <3`,
  inputDateText: 'Please enter the next date you\'ll see your significant other <3',
  inputNameText: 'Please enter the name of your significant other <3',
  successSubscriptionText: 'You have subscribed to recieve messages once a day 😍',
  successUnsubscriptionText: 'You have unsubscribed from recieving messages :(',
  errorDateText: 'Please enter a valid date MM/DD/YYYY 📆',
  errorSubscriptionText: 'You already have a subscription 👍',
  errrorUnsubscriptionText: 'You have no current subscriptions. Try typing "subscribe"',
  errorCommandText: 'Didn\'t quite get that. Try typing "help"',
}