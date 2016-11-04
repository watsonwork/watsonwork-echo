// A sample chatbot app that listens to messages posted to a space in IBM
// Watson Workspace and echoes hello messages back to the space

// Test the happy path

import { expect } from 'chai';
import * as jsonwebtoken from 'jsonwebtoken';
import { post } from 'request';

// Rudimentary mock of the request module
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

  it('authenticates the app', (done) => {

    // Check async callbacks
    let checks = 0;
    const check = () => {
      if(++checks === 2)
        done();
    };

    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Echo Web app
    echo.webapp('testappid', 'testsecret', 'testwsecret', (err, app) => {
      expect(err).to.equal(null);
      check();
    });
  });

  it('handles Webhook challenge requests', (done) => {

    // Check async callbacks
    let checks = 0;
    const check = () => {
      if(++checks === 2)
        done();
    };

    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Echo Web app
    echo.webapp('testappid', 'testsecret', 'testwsecret', (err, app) => {
      expect(err).to.equal(null);

      // Listen on an ephemeral port
      const server = app.listen(0);

      // Post a Webhook challenge request to the app
      post('http://localhost:' + server.address().port + '/echo', {
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
      }, (err, res) => {
        expect(err).to.equal(null);
        expect(res.statusCode).to.equal(200);

        // Expect correct challenge response and signature
        expect(res.body.response).to.equal('testchallenge');
        expect(res.headers['x-outbound-token']).to.equal(
          // Signature of the test body with the Webhook secret
          '876d1f9de1b36514d30bcf48d8c4731a69500730854a964e31764159d75b88f1');

        check();
      });
    });
  });

  it('Echoes messages back', (done) => {

    // Check async callbacks
    let checks = 0;
    const check = () => {
      if(++checks === 3)
        done();
    };

    postspy = (uri, opt, cb) => {
      // Expect a call to get the OAuth token of an app
      if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
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
              name: 'from sample echo app',
              avatar: 'https://avatars1.githubusercontent.com/u/22985179',
              url: 'https://github.com/watsonwork/watsonwork-echo'
            }
          }]
        });
        setImmediate(() => cb(undefined, {
          statusCode: 201,
          // Return list of spaces
          body: {
          }
        }));
        check();
      }
    };

    // Create the Echo Web app
    echo.webapp('testappid', 'testsecret', 'testwsecret', (err, app) => {
      expect(err).to.equal(null);

      // Listen on an ephemeral port
      const server = app.listen(0);

      // Post a chat message to the app
      post('http://localhost:' + server.address().port + '/echo', {
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
      }, (err, val) => {
        expect(err).to.equal(null);
        expect(val.statusCode).to.equal(201);

        check();
      });
    });
  });

  it('rejects messages with invalid signature', (done) => {

    // Check async callbacks
    let checks = 0;
    const check = () => {
      if(++checks === 2)
        done();
    };

    postspy = (uri, opt, cb) => {
      // Expect a call to get an OAuth token for the app
      if(uri === 'https://api.watsonwork.ibm.com/oauth/token') {
        oauth(uri, opt, cb);
        check();
        return;
      }
    };

    // Create the Echo Web app
    echo.webapp('testappid', 'testsecret', 'testwsecret', (err, app) => {
      expect(err).to.equal(null);

      // Listen on an ephemeral port
      const server = app.listen(0);

      // Post a chat message to the app
      post('http://localhost:' + server.address().port + '/echo', {
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
      }, (err, val) => {
        expect(err).to.equal(null);

        // Expect the request to be rejected
        expect(val.statusCode).to.equal(401);

        check();
      });
    });
  });
});

