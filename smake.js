const { magenta } = require('colors/safe');

const builds = [
  ...require('./examples/buildNodeAddonDarwin'),
  ...require('./examples/buildNodeAddonLinux'),
  ...require('./examples/buildNodeAddonWin32'),
];

module.exports = [
  ...builds,
];