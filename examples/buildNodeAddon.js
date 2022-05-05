const { NodeAddon } = require('../lib');

module.exports = function (target) {
  const node_addon = new NodeAddon('node_addon', target);
  node_addon.NODE_VERSION = 'v18.0.0';
  node_addon.files = ['examples/src/addon.cc', 'examples/src/Greeter.cc'];

  return node_addon;
};
