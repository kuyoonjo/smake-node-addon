const build = require('./buildNodeAddon');

module.exports = [
  build('arm64-apple-darwin'),
  build('x86_64-apple-darwin'),
];