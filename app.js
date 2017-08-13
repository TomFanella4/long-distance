/* Reminder Bot */

'use strict';

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');

const webhook = require('./routes/webhook');
const helpers = require('./helpers/common');

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));

if (!(helpers.APP_SECRET && helpers.VALIDATION_TOKEN &&
      helpers.PAGE_ACCESS_TOKEN && helpers.MONGODB_URI)) {
  console.error("Missing env values");
  process.exit(1);
}

mongoose.connect(helpers.MONGODB_URI);
mongoose.Promise = global.Promise;

app.use('/', webhook);

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', helpers.APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

