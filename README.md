# watsonwork-greeter

[![Build Status](https://travis-ci.org/jsdelfino/watsonwork-greeter.svg)](https://travis-ci.org/jsdelfino/watsonwork-greeter)

A Node.js example chatbot app that listens to a conversation and responds with
greeting messages.

The Watson Work platform provides **spaces** for people to exchange
**messages** in conversations. This app shows how to listen to a conversation
and receive messages on a Webhook endpoint, then send response messages back
to the conversation. It also demonstrates how to authenticate an application
and obtain the OAuth token needed to make Watson Work API calls.

## Try it out

To try the sample app do the following:

### Register the app

In your Web browser, go to [Watson Work Services - Apps]
(https://workspace.ibm.com/developer/apps) and add a new app named
**Greeter** with a Webhook configured for **message-created** events.
Set the Webhook **Callback URL** to a public URL targeting the server where
you're going to run the sample app, `https://<your server hostname>/greeter`
for example. Save the app and write down its app id, app secret and
Webhook secret.

**TODO** Describe how to use a secure tunnel from a public URL to a local
development server.

### Build the app

Install Node.js 6+.

In a terminal window, do the following:
```sh
# For more verbose output
export DEBUG=watsonwork-*

# To get the code
git clone https://github.com/jsdelfino/watsonwork-greeter

# To build the sample app
cd watsonwork-greeter
npm run build
```

### Start the app

You're now ready to start the sample Greeter app!

In the terminal window, do the following:
```
# Configure the app id and app secret
export GREETER_APP_ID=<the Greeter app id>
export GREETER_APP_SECRET=<the Greeter app secret>
export GREETER_WEBHOOK_SECRET=<the Greeter Webhook secret>
```

The Watson Work platform requires Webhook endpoints to use HTTPS. The
sample app listens on HTTPS port 443 and can be configured to use an SSL
certificate like follows:
```
# Configure the SSL certificate
export SSLCERT=<path to your SSL certificate in PEM format>
export SSLKEY=<path to your SSL certificate key in PEM format>

# Start the app
npm start
```

You can also use a different HTTPS port number and a self-signed certificate,
like follows:
```
# Configure the HTTPS port number
export SSLPORT=8443

# Generate and use a self-signed SSL certificate
openssl req -nodes -new -x509 -keyout server.key -out server.crt -subj "/CN=localhost"
export SSLCERT=server.crt
export SSLKEY=server.key

# Start the app
npm start
```

If you're running behind a HTTPS proxy, you may want to have the app listen
on HTTP instead to let the proxy handle the HTTPS to HTTP conversion, like
follows:
```
# Configure the HTTP port
export PORT=8080

# Start the app
npm start
```

### Enable the app Webhook

Now that the app is running and listening for HTTPS requests at a public URL,
you're ready to *enable* its Webhook on the Watson Work platform.

In your Web browser, edit the **Greeter** app and set its Webhook to
**Enabled**. Watson Work will ping the Webhook callback URL with a
verification challenge request to check that it's up and responding
correctly.

The sample app will respond to that challenge request and log the following
in the terminal window:
```
watsonwork-greeter-app Got Webhook verification challenge
```

### Chat with the app in a space

You're now ready to chat with the sample app!

Go to [Watson Workspace](https://workspace.ibm.com) and create a space
named **Examples**, then open the **Apps** tab for that space and add the
**Greeter** app to it.

In the **Examples** space, say "*Hello there*". The app will respond with a
greeting message echoing what you just said: "*Hey [your name], did you say
Hello there?*"

The terminal window will show the following log output:
```
watsonwork-greeter-app Got a message { <message details here> }
watsonwork-greeter-app Sent greeting message to space <space id>
```

## Layout

The example source tree is organized as follows:

```sh
README.md     - this README
package.json  - Node.js package definition

src/          - Javascript sources

  app.js      - main app script
  oauth.js    - obtains OAuth tokens for the app
  ssl.js      - configures the app with an SSL certificate

  test/       - unit tests
```

## What API does the app use?

The app uses the [Watson Work OAuth API]
(https://workspace.ibm.com/developer/docs) to authenticate and get an
OAuth token. It implements a Webhook endpoint according to the
[Watson Work Webhook API](https://workspace.ibm.com/developer/docs) to
listen to conversations and receive messages. Finally, it uses the
[Watson Work Spaces API] (https://workspace.ibm.com/developer/docs) to send
back greeting messages.

## How can I contribute?

Pull requests welcome!

