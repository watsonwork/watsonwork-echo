// A sample chatbot app that listens to messages posted to a space in IBM
// Watson Workspace and echoes hello messages back to the space

// Test the happy path

import { expect } from 'chai';
import * as jsonwebtoken from 'jsonwebtoken';
import { post } from 'request';
import Promise from 'bluebird';

// Promisify Request.post BEFORE overwrite
const postAsync = Promise.promisify(post);

// Rudimentary mock of the request module
// This overwrites Request.post
let postspy;
require.cache[require.resolve('request')].exports = {
  post: (uri, opt, cb) => postspy(uri, opt, cb)
};

// Load the Echo app
const echo = require('../app');

// Generate a test OAuth token
const token = jsonwebtoken.sign({}, 'secret', { expiresIn: '1h' });
describe('watsonwork-echo', () => {

  // Mock the Watson Work OAuth service
  const oauth = (uri, opt, cb) => {
    expect(opt.auth).to.deep.equal({
      user: 'testappid',
      pass: 'testsecret'
    });
    expect(opt.json).to.equal(true);
    expect(opt.form).to.deep.equal({
      grant_type: 'client_credentials'
    });

    // Return OAuth token
    setImmediate(() => cb(undefined, {
      statusCode: 200,
      body: {
        access_token: token
      }
    }));
  };

  it('authenticates the app', async () => {
    
    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        return;
      }
    };
  
    try { 
      // Create the Echo Web app
      const app = await echo.webapp('testappid', 'testsecret', 'testwsecret');
      expect(app).to.not.equal(null);
      expect(app).to.not.equal(undefined);
    }
    catch(err) {
      throw err;
    }

  });


  it('handles Webhook challenge requests', async () => {

    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        return;
      }
    };
    
    try {
      // Create the echo web app
      const app = await echo.webapp('testappid', 'testsecret', 'testwsecret');
      expect(app).to.not.equal(null);
      expect(app).to.not.equal(undefined);

      // Listen on an ephemeral port
      const server = app.listen(0);
      
      // Post Webhook challenge request to the app
      const res = await postAsync(
        'http://localhost:' + server.address().port + '/echo', {
          headers: {
            // Signature of the test body with the Webhook secret
            'X-OUTBOUND-TOKEN':
              'f51ff5c91e99c63b6fde9e396bb6ea3023727f74f1853f29ab571cfdaaba4c03'
          },
          json: true,
          body: {
            type: 'verification',
            challenge: 'testchallenge'
          }
        });

      // Check that state of the response
      expect(res.statusCode).to.equal(200);
        
      // Expect correct challenge response and signature
      expect(res.body.response).to.equal('testchallenge');
      expect(res.headers['x-outbound-token']).to.equal(
        // Signature of the test body with the Webhook secret
        '876d1f9de1b36514d30bcf48d8c4731a69500730854a964e31764159d75b88f1');
    }
    catch(err) {
      throw err;
    }
    
  });

  it('Echoes messages back', async () => {

    postspy = (uri, opt, cb) => {
      // Expect a call to get the OAuth token of an app
      if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        return;
      }

      // Expect a call to send echoed message to the test space
      if(uri ===
        'https://api.watsonwork.ibm.com/v1/spaces/testspace/messages') {
        expect(opt.headers).to.deep.equal({
          Authorization: 'Bearer ' + token
        });
        expect(opt.json).to.equal(true);
        expect(opt.body).to.deep.equal({
          type: 'appMessage',
          version: 1.0,
          annotations: [{
            type: 'generic',
            version: 1.0,

            color: '#6CB7FB',
            title: 'Echo message',
            text: 'Hey Jane, did you say Hello there?',

            actor: {
              name: 'Sample echo app'
            }
          }]
        });
        setImmediate(() => cb(undefined, {
          statusCode: 201,
          // Return list of spaces
          body: {
          }
        }));
      }
    };

    try {
      // Create the echo web app
      const app = await echo.webapp('testappid', 'testsecret', 'testwsecret');
      expect(app).to.not.equal(null);
      expect(app).to.not.equal(undefined);

      // Listen on an ephemeral port
      const server = app.listen(0);
      
      // Post a chat message to the app
      const val = await postAsync(
        'http://localhost:' + server.address().port + '/echo', {
          headers: {
            'X-OUTBOUND-TOKEN':
              // Signature of the body with the Webhook secret
              '7b36f68c9ef83e62c154d7f5eaad634947f1e92931ac213462f489d7d8f8bcad'
          },
          json: true,
          body: {
            type: 'message-created',
            content: 'Hello there',
            userName: 'Jane',
            spaceId: 'testspace'
          }
        });

      // check successful response status
      expect(val.statusCode).to.equal(201);
    }
    catch(err) {
      throw err;
    }
  });

  it('rejects messages with invalid signature', async () => {

    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        // check();
        return;
      }
    };

    try {
      // Create the echo web app
      const app = await echo.webapp('testappid', 'testsecret', 'testwsecret');
      expect(app).to.not.equal(null);
      expect(app).to.not.equal(undefined);
      
      // create the server on an ephemeral port
      const server = app.listen(0);
      
      // Send a request with invalid signature to be rejected
      const val = await postAsync(
        'http://localhost:' + server.address().port + '/echo', {
          headers: {
            'X-OUTBOUND-TOKEN':
              // Test an invalid body signature
              'invalidsignature'
          },
          json: true,
          body: {
            type: 'message-created',
            content: 'Hello there',
            userName: 'Jane',
            spaceId: 'testspace'
          }
        });

      // Expect an invalid status code
      expect(val.statusCode).to.equal(401);
    }
    catch(err) {
      throw err;
    }
  });

});


