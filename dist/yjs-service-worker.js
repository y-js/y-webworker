
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
    var dOptions = Y.utils.copyObject(delegatedConnectorOptions)
    dOptions.room = options.room
    super(y, dOptions)
    this.swOptions = options
    addEventListener('message', event => {
      if (event.data.room === this.swOptions.room && event.data.type === 'message') {
        this.receiveMessage(event.data.guid, event.data.message, 'serviceworker')
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
    var clientId = this.connections[uid].clientId
    if (clientId != null) {
      clients.get(clientId).then(c => {
        c.postMessage({
          type: 'message',
          room: this.swOptions.room,
          message: message,
          guid: uid
        })
      })
    } else {
      super.send(uid, message)
    }
  }
  _broadcastSW (message) {
    clients.matchAll({includeUncontrolled: true, type: 'window'}).then(cs => {
      console.log('number of clients: ' + cs.length)
      cs.map(c => {
        c.postMessage({
          type: 'message',
          room: this.swOptions.room,
          message: message,
          guid: null
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
          room: event.data.room,
          auth: event.data.auth
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
        room: event.data.room,
        guid: event.data.guid
      })
      y.connector.userJoined(event.data.guid, 'slave')
      y.connector.connections[event.data.guid].clientId = event.source.id
      // reset auth if new auth data is supplied
      if (event.data.auth != null) {
        y.connector.resetAuth(event.data.auth)
      }
    })
  } else if (event.data.room != null && event.data.type === 'leave') {
    instances[event.data.room].then(y => {
      y.connector.userLeft(event.data.guid)
    })
  }
})

