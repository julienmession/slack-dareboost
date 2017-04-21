const mongoose = require('mongoose');

// use native Promise
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGO_CONNECT);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));

db.once('open', function() {
  console.log('we re connected!');
});

module.exports = { mongoose: mongoose };
