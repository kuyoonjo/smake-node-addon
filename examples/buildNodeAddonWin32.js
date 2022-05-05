const build = require('./buildNodeAddon');

module.exports = [
  build('x86_64-pc-windows-msvc'),
  // build('i686-pc-windows-msvc'),
];