# @smake/node-addon

```js
// smake.js
const { NodeAddon } = require('@smake/node-addon');

const target = 'armv7-unknown-linux-gnu';

const node_addon = new NodeAddon('node_addon', target);
node_addon.files = ['examples/src/addon.cc', 'examples/src/Greeter.cc'];

module.exports = [
  node_addon,
];
```