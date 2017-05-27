// read params in .env file
require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./db');
const port = process.env.PORT || 3000;

//require the body-parser nodejs module
bodyParser = require('body-parser'),
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));
app.use('/slack', require('./route/slack'));
app.use('/test', require('./route/test'));

app.listen(port, function () {
  console.log('App listening on port '+port);
});
