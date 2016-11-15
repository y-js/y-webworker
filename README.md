# ServiceWorker Connector for [Yjs](https://github.com/y-js/yjs)

It enables you to communicate with a service worker thread. Currently, the best use-case is
to set up a service worker that persists changes using
[y-indexeddb](https://github.com/y-js/y-indexeddb), and use y-serviceworker to communicate
with it using the [postMessage interface](https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage).
The service worker is supposed to propagate all changes to all users using another connector.

We provide you with a free signaling server (it is used by default), but in production you should set up your own signaling server. You could use the [signalmaster](https://github.com/DadaMonad/signalmaster) from &yet, which is very easy to set up.

## Use it!
Retrieve this with bower or npm.

##### NPM
```
npm install y-serviceworker --save
```

##### Bower
```
bower install y-serviceworker --save
```

### Example

**Client:**
```javascript
// Register service worker - do this once
if ('serviceWorker' in navigator) {
  // service worker is supported by the browser
  navigator.serviceWorker.register('yjs-service-worker.js', {scope: '../bower_components/y-serviceworker'}).then(function(registration) {
    console.log('Yjs ServiceWorker registration successful')
  }).catch(function(err) {
    console.log('Yjs ServiceWorker registration failed: ', err)
  })
} else {
  // you should use another connector instead
}

// connect to the service worker
Y({
  db: {
    name: 'memory'
  },
  connector: {
    name: 'serviceworker',
    scope: '../bower_components/y-serviceworker',
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

## License
[y-serviceworker](https://github.com/y-js/y-serviceworker) is licensed under the [MIT License](./LICENSE).

<kevin.jahns@rwth-aachen.de>


