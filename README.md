# Web Worker Connector for [Yjs](https://github.com/y-js/yjs)

It enables communication with a [SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker/SharedWorker) thread.
The Shared Worker is can handle the connections, and save changes using a persistent database (e.g. [y-indexeddb](https://github.com/y-js/y-indexeddb)),
while the clients connect to the shared worker with improved performance. It also enables you to perform background tasks in the Shared Worker.

In the future you may want set up a [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
that keeps the Shared Worker running even after the page is closed - thus enabling synchronization after the page is closed. But this is not yet supported - [see issue](https://github.com/whatwg/html/issues/411)

## Use it!
Retrieve this with bower or npm.

##### NPM
```bash
npm install y-webworker --save
```

##### Bower
```bash
bower install y-webworker --save
```

### Example

```js
// Connect to the web worker
Y({
  db: {
    name: 'memory'
  },
  connector: {
    name: 'webworker',
    url: '/bower_components/y-webworker/yjs-webworker.js',
    room: 'my room name'
  },
  sourceDir: '/bower_components', // location of the y-* modules
  share: {
    textarea: 'Text' // y.share.textarea is of type Y.Text
  }
}).then(function (y) {
  // bind the textarea to a shared text element
  y.share.textarea.bind(document.getElementById('textfield'))
}
```

##### Modify yjs-webworker.js
The default behavior of `yjs-webworker.js` is to use y-indexeddb, and connect to the default server using y-websockets-client.
For productive systems you should copy & modify the file for your set-up. 

## License
[y-webworker](https://github.com/y-js/y-webworker) is licensed under the [MIT License](./LICENSE).

<kevin.jahns@rwth-aachen.de>


