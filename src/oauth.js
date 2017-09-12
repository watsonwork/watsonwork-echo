// Regularly obtain a fresh OAuth token for the app
import * as request from 'request';
import * as jsonwebtoken from 'jsonwebtoken';
import debug from 'debug';
import Promise from 'bluebird';

// Setup debug log
const log = debug('watsonwork-echo-oauth');

// Promisify request's post function
const post = Promise.promisify(request.post);


// Obtain an OAuth token for the app, repeat at regular intervals before the
// token expires. Returns a function that will always return a current
// valid token.
export const run = async (appId, secret) => {
  let tok;

  // Return the current token
  const current = () => tok;

  // Return the time to live of a token
  const ttl = (tok) => 
    Math.max(0, jsonwebtoken.decode(tok).exp * 1000 - Date.now());
  // Refresh the token
  const refresh = async () => {
    log('Getting token');
    const res = await post('https://api.watsonwork.ibm.com/oauth/token', {
      auth: {
        user: appId,
        pass: secret
      },
      json: true,
      form: {
        grant_type: 'client_credentials'
      }
    });

    // check the status code of the result
    if (res.statusCode !== 200) 
      throw new Error(res.statusCode);
    
    // Save the fresh token
    log('Got new token');
    tok = res.body.access_token;

    // Schedule next refresh a bit before the token expires
    const t = ttl(tok);
    log('Token ttl', t);
    setTimeout(refresh, Math.max(0, t - 60000)).unref();


    // return the current token
    return current;
  };

  // Obtain initial token
  return await refresh();
};

