// Return HTTPS server SSL configuration

// Feel free to adapt to your particular security and hosting environment

import * as fs from 'fs';
import debug from 'debug';
import Promise from 'bluebird';
// Debug log
const log = debug('watsonwork-echo-ssl');


// Promisify filesystem readfile for readablility
const readFile = Promise.promisify(fs.readFile); 

// Return HTTPS server SSL configuration
export const conf = async (env) => {
  
  // Try reading the cert and key
  try {
    const cert = await readFile(env.SSLCERT || './server.cert');
    const key = await readFile(env.SSLKEY, './server.key');
    return {
      cert: cert,
      key: key
    }; 
  } 
  catch(err) {
    log('Error reading SSL cert or key %o', err);
    throw err;
  }
  // the ssl certificate was not successfully created
  return new Error('Unable to create SSL configuration');
};
