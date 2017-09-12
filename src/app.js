// A sample chatbot app that listens to messages posted to a space in IBM
// Watson Workspace and echoes hello messages back to the space

import express from 'express';
import * as request from 'request';
import * as util from 'util';
import * as bparser from 'body-parser';
import { createHmac } from 'crypto';
import * as http from 'http';
import * as https from 'https';
import * as oauth from './oauth';
import * as ssl from './ssl';
import debug from 'debug';
import Promise from 'bluebird';

// Debug log
const log = debug('watsonwork-echo-app');

const post = Promise.promisify(request.post);

// Echoes Watson Work chat messages containing 'hello' or 'hey' back
// to the space they were sent to
export const echo = (appId, token) => async (req, res) => {
  // Respond to the Webhook right away, as the response message will
  // be sent asynchronously
  res.status(201).end();

  // Only handle message-created Webhook events, and ignore the app's
  // own messages
  if(req.body.type !== 'message-created' || req.body.userId === appId)
    return;

  log('Got a message %o', req.body);

  // React to 'hello' or 'hey' keywords in the message and send an echo
  // message back to the conversation in the originating space
  if(req.body.content
    // Tokenize the message text into individual words
    .split(/[^A-Za-z0-9]+/)
    // Look for the hello and hey words
    .filter((word) => /^(hello|hey)$/i.test(word)).length)

    // Send the echo message
    await send(req.body.spaceId,
      util.format(
        'Hey %s, did you say %s?',
        req.body.userName, req.body.content),
      token());
  log('Sent message to space %s', req.body.spaceId);
};

// Send an app message to the conversation in a space
const send = async (spaceId, text, tok) => {
  let res;
  try {
    res = await post(
      'https://api.watsonwork.ibm.com/v1/spaces/' + spaceId + '/messages', {
        headers: {
          Authorization: 'Bearer ' + tok
        },
        json: true,
        // An App message can specify a color, a title, markdown text and
        // an 'actor' useful to show where the message is coming from
        body: {
          type: 'appMessage',
          version: 1.0,
          annotations: [{
            type: 'generic',
            version: 1.0,

            color: '#6CB7FB',
            title: 'Echo message',
            text: text,

            actor: {
              name: 'Sample echo app'
            }
          }]
        }
      });
    
    // Handle invalid status response code
    if (res.statusCode !== 201)
      throw new Error(res.statusCode);
    
    // log the valid response and its body
    else 
      log('Send result %d, %o', res.statusCode, res.body);
  } 
  catch(err) {
    // log the error and rethrow it
    log('Error sending message %o', err);
    throw err; 
  } 
  return res;
};

// Verify Watson Work request signature
export const verify = (wsecret) => (req, res, buf, encoding) => {
  if(req.get('X-OUTBOUND-TOKEN') !==
    createHmac('sha256', wsecret).update(buf).digest('hex')) {
    log('Invalid request signature');
    const err = new Error('Invalid request signature');
    err.status = 401;
    throw err;
  }
};

// Handle Watson Work Webhook challenge requests
export const challenge = (wsecret) => (req, res, next) => {
  if(req.body.type === 'verification') {
    log('Got Webhook verification challenge %o', req.body);
    const body = JSON.stringify({
      response: req.body.challenge
    });
    res.set('X-OUTBOUND-TOKEN',
      createHmac('sha256', wsecret).update(body).digest('hex'));
    res.type('json').send(body);
    return;
  }
  next();
};

// Create Express Web app
export const webapp = async (appId, secret, wsecret) => {
  // Authenticate the app and get an OAuth token
  const token = await oauth.run(appId, secret);
  // Configure Express route for the app Webhook
  return express().post('/echo',

    // Verify Watson Work request signature and parse request body
    bparser.json({
      type: '*/*',
      verify: verify(wsecret)
    }),

    // Handle Watson Work Webhook challenge requests
    challenge(wsecret),

    // Handle Watson Work messages
    echo(appId, token));
};

// App main entry point
const main = async (argv, env) => {
  try {
    // Create Express Web app
    const app = await webapp(
      env.ECHO_APP_ID, env.ECHO_APP_SECRET,
      env.ECHO_WEBHOOK_SECRET); 
    if(env.PORT) {
      // In a hosting environment like Bluemix for example, HTTPS is
      // handled by a reverse proxy in front of the app, just listen
      // on the configured HTTP port
      log('HTTP server listening on port %d', env.PORT);
      http.createServer(app).listen(env.PORT);
    }

    else {
      
      // Listen on the configured HTTPS port, default to 443
      const sslConfig = await ssl.conf(env); 
      const port = env.SSLPORT || 443;
      log('HTTPS server listening on port %D', port);
      https.createServer(sslConfig, app).listen(port);
    }
  } 
  catch(err) {
    throw err;
  }
};

// Run main as IIFE (top level await not supported)
(async () => {
  if (require.main === module) 
    try {
      await main(process.argv, process.env); 
      log('App started!'); 
    } 
    catch(err) {
      console.log('Error starting app:', err);
    }
})();


