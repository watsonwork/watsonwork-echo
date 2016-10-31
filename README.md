watsonwork-greeter
===

[![Build Status](https://travis-ci.org/jsdelfino/watsonwork-greeter.svg)](https://travis-ci.org/jsdelfino/watsonwork-greeter)

A Node.js example chatbot app that listens to a conversation and responds with
greeting messages.

Watson Work provides **spaces** for people to exchange **messages** in 
conversations. This program shows how to listen to a conversation using a
Watson Work Webhook and how to send response messages back to the
conversation.

It also demonstrates how to authenticate an application and obtain the
OAuth token needed to make Watson Work API calls.

Try it out
---

To try the sample app do the following:

In your Web browser, go to [Watson Work Services - Apps]
(https://workspace.ibm.com/developer/apps) and on that page add a new app
named **Greeter**, with a Webhook configured to send **message-created**
events to the public **Callback URL** of the sample app, 
`https://<your server hostname>/greeter`.

**TODO** Describe how to use a secure tunnel to a local development server.

Write down the app id, app secret and Webhook secret for the new app.

Install Node.js 6+.

In a terminal window, do the following:
```sh
# Configure the app id and app secret you just got
export GREETER_APP_ID=<the Greeter app id>
export GREETER_APP_SECRET=<the Greeter app secret>
export GREETER_WEBHOOK_SECRET=<the Greeter Webhook secret>

# For more verbose output
export DEBUG=watsonwork-*

# To get the code
git clone https://github.com/jsdelfino/watsonwork-greeter

# To build the sample app
cd watsonwork-greeter
npm run build

# If you want the app to listen on a port different than the default 8443
export SSLPORT=8123

# If you want to use a self-signed SSL certificate for the app
openssl req -nodes -new -x509 -keyout server.key -out server.crt -subj "/CN=localhost"
export SSLCERT=server.crt
export SSLKEY=server.key

# If you're running behind a proxy that handles HTTPS for you
# To have the app just listen on HTTP
export PORT=8080

# To start the app
npm start
```

In your Web browser, select the **Greeter** app you just created and set its
Webhook to **Enabled**. Watson Work will ping your app with a verification
challenge request to check that it's up and responding correctly.

The sample app will respond to that verification request, and log the
following in the terminal window:
```
watsonwork-greeter-app Got Webhook verification challenge
```

Go to [Watson Workspace](https://workspace.ibm.com) and create a space
named **Examples**.

Navigate to the **Apps** tab for that space and add the **Greeter** app to it.

You're now ready to chat with the sample app!

In the **Examples** space, say "*Hello there*".

The app will respond with a greeting message echoing what you just said:
"*Hey [your name], did you say Hello there?*"

The terminal window will also show the app log output:
```
watsonwork-greeter-app Got a message { <message details here> }
watsonwork-greeter-app Sent greeting message to space <space id>
```

Layout
---

The example source tree is organized as follows:

```sh
README.md     - this README
package.json  - Node.js package definition

src/          - Javascript sources

  app.js      - main app script
  oauth.js    - obtains OAuth tokens for the app
  ssl.js      - sets up an SSL cert for the Webhook

  test/       - unit tests
```

What API does the app use?
---

The app uses the [Watson Work OAuth API]
(https://workspace.ibm.com/developer/docs) to authenticate and get an
OAuth token.

It implements a Webhook endpoint according to the [Watson Work Webhook API]
(https://workspace.ibm.com/developer/docs) to listen to conversations and
receive messages.

Finally, it uses the [Watson Work Spaces API]
(https://workspace.ibm.com/developer/docs) to send back greeting messages.

How can I contribute?
--

Pull requests welcome!

