
importScripts(
  '../yjs/y.js',
  '../y-memory/y-memory.js',
  '../y-indexeddb/y-indexeddb.js',
  '../y-websockets-client/y-websockets-client.js'
)

const DelegatedConnector = Y['websockets-client']
const delegatedConnectorOptions = {
  name: 'websockets-client',
  options: {
    jsonp: false
  }
}

class Serviceworker extends DelegatedConnector {
  constructor (y, options) {
    var dOptions = {
      name: 'websockets-client',
      options: {
        jsonp: false
      }
    }
    dOptions.room = options.room
    super(y, dOptions)
    this.swOptions = options
    addEventListener('message', event => {
      if (event.data.room === this.swOptions.room && event.data.type === 'message') {
        this.receiveMessage(event.source.id, event.data.message, 'serviceworker')
      }
    })
  }
  receiveMessage(uid, message, source) {
    if (message.type === 'update') {
      if (source === 'serviceworker') {
        super.broadcast(message)
      } else {
        this._broadcastSW(message)
      }
    }
    super.receiveMessage(uid, message, source)
  }
  send (uid, message) {
    clients.get(uid).then(c => {
      if (c != null) {
        c.postMessage({
          type: 'message',
          room: this.swOptions.room,
          message: message
        })
      } else {
        super.send(uid, message)
      }
    }, () => {
      super.send(uid, message)
    })
  }
  _broadcastSW (message) {
    clients.matchAll({includeUncontrolled: true, type: 'window'}).then(cs => {
      console.log('number of clients: ' + cs.length)
      cs.map(c => {
        c.postMessage({
          type: 'message',
          room: this.swOptions.room,
          message: message
        })
      })
    })
  }
  broadcast (message) {
    this._broadcastSW(message)
    super.broadcast(message)
  }
}
Y.extend('serviceworker', Serviceworker)

var instances = {}

addEventListener('message', event => {
  if (event.data.room != null && event.data.type === 'join') {
    if (instances[event.data.room] == null) {
      instances[event.data.room] = Y({
        connector: {
          name: 'serviceworker',
          room: event.data.room
        },
        db: {
          name: 'indexeddb',
          namespace: 'sw-' + event.data.room
        }
      })
    }
    instances[event.data.room].then(y => {
      event.source.postMessage({
        type: 'join',
        room: event.data.room
      })
      y.connector.userJoined(event.source.id, 'slave')
    })
  }
})

addEventListener('activate', function (event) {
})

