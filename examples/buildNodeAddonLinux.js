const build = require('./buildNodeAddon');

module.exports = [
  build('aarch64-linux-gnu'),
  build('x86_64-linux-gnu'),
  build('arm-linux-gnueabihf'),
];