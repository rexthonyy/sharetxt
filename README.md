# ShareTXT

**A website to Share text between browser windows in real time.**

## Introduction

[ShareTXT](http://sharetxt.live) is a web application that uses the javascript websocket api to connect multiple browser windows, enabling real time data transfer between them.

## Dependencies 
  1.  Express  
  2.  ws 
  3.  ejs
  
## NPM
Clone this repo and run the following command
```bash
$ npm install sharetxt
```

## How it works 
  1.  A user requests the web page from the node js server by entering the link in the browser either http://sharetxt.live or http://sharetxt.live/{route} .
  2.  The node js server uses the route passed through the url to create and return the web page or if no route is passed, it creates a default route and uses it to create the webpage. This is achieved using the ejs templating language.
  3.  The webpage is loaded by the clients browser
  4.  A web socket connection request is sent to the node js backend server.
  5.  After a successful web socket connection is established, a callback function is triggered on the frontend.
  6.  The route which was used to create the web page is passed to the backend using the web socket connection which was established.
  7.  In the backend the connection is added to an array which is mapped to the route. This array map assigns web socket connections into groups depending on what route they are connected to.
  8.  All clients connected to the same route are notified about the new connection so that they can update their ui.
  9.  Clients which are connected to the web socket can now send messages among themselves as long as they are connected to the same route.
  10.  An oninput listener is attached to the text input so that as text is entered into the input, it is sent to other clients connected to the same route.
  11.   The last client that sends a message is noted in the __isLastClientToInputData__ variable. This is used to resend the message to all connected clients in the event that a new client connects to the same route.
  12.   When a user closes the web page, the web socket connection is terminated and all connected clients to that route are notified.
  
## Change log
* **1.2.2** (2021-2-12): Created the documentation
* **1.2.1** (2021-2-12): Fixed the closing of web socket connection after some period of inactivity
* **1.2.0** (2021-2-11): Added feature to notify the last client that sends a message in a route to resend the message when a new client connects to the route. 
* **1.1.2** (2021-2-11): Updated the website icon, social media card and added product hunt logo.
* **1.1.1** (2021-2-9): Added a listener to listen for when a client connects and terminates the sockets connection inorder to notify the front end to update its user interface.
* **1.1.0** (2021-2-9): Added ejs to create dynamic web pages to support routes
* **1.0.2** (2021-2-8): Removed the send button and added an oninput listener to the input field.
* **1.0.1** (2021-2-8): Added some css to update the user interface
* **1.0.0** (2021-2-8): Initial release

## People
---
These are people who contributed to project in one way or the other :heart:

*	[@101TWOTWO](https://twitter.com/101TWOTWO)
*	[@Abisalde](https://twitter.com/Abisalde)
*	[@Errson2](https://twitter.com/Errson)
*	[@favouriteJome1](https://twitter.com/favouriteJome1)
*	[@frankiefab100](https://twitter.com/frankiefab100)
*	[@heisdeku](https://twitter.com/heisdeku)
*	[@iam_ceo](https://twitter.com/iam_ceo)
*	[@iamajibolasegun](https://twitter.com/iamajibolasegun)
*	[@jay_jm](https://twitter.com/jay_jm)
*	[@kelechithe3rd](https://twitter.com/kelechithe3rd)
*	[@PharmSaheed](https://twitter.com/PharmSaheed)
*	[@Srushtika](https://twitter.com/Srushtika)
*	[@SudhamJayanthi](https://twitter.com/SudhamJayanthi)