const mongoose = require('mongoose');
const helpers = require('./../helpers/common')

const userSchema = mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    context: String,
    firstName: String,
    lastName: String,
    local: String,
    timezone: String,
    gender: String,
    significantOther: String,
    countdownDate: Number,
    nextUpdate: Number
});

userSchema.statics.findExistingUserAndCreate = function (senderID) {
    return new Promise((resolve, reject) => {
      this.findOne({id: senderID}).exec()
      .then(user => {
        console.log(user);
        if (!user) {
          helpers.getUserInfo(senderID)
          .then(user => {
            let newUser = new this({
              id: senderID,
              context: 'start',
              firstName: user.first_name,
              lastName: user.last_name,
              local: user.locale,
              timezone: user.timezone,
              gender: user.gender
            })
            newUser.save();
            resolve(newUser);
          })
          .catch(error => console.log(error))
        } else {
          resolve(user);        
        }
      })
    })
    .catch(error => reject(error));
  }

module.exports = mongoose.model('User', userSchema);
