function SlackHelper() {}

SlackHelper.prototype.formatResponse = function(command, text, err, str) {
  if (err) {
    return err;
  }
  return str;
}

module.exports = new SlackHelper();
