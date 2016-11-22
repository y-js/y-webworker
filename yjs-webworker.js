
DBConfig = {
  name: 'indexeddb'
}
ConnectorConfig = {
  name: 'websockets-client',
  // url: '..',
  options: {
    jsonp: false
  }
}

importScripts(
  '../yjs/y.js',
  '../y-memory/y-memory.js',
  '../y-indexeddb/y-indexeddb.js',
  '../y-websockets-client/y-websockets-client.js',
  './yjs-webworker-service.js'
)
