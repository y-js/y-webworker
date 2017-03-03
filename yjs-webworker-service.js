
class WebworkerConnector extends Y[ConnectorConfig.name] {
  constructor (y, options) {
    var dOptions = Y.utils.copyObject(ConnectorConfig)
    dOptions.room = options.room
    dOptions.auth = options.auth
    super(y, dOptions)
    this.swOptions = options
  }
  userJoined (uid, role, port) {
    super.userJoined(uid, role)
    if (port != null) {
      port.addEventListener('message', event => {
        if (event.data.room === this.swOptions.room && event.data.type === 'message') {
          this.receiveMessage(uid, event.data.message, 'webworker')
        }
      })
      this.connections[uid].port = port
    }
  }
  receiveMessage(uid, message, source) {
    if (message.type === 'update') {
      this.broadcast(message, uid)
    }
    super.receiveMessage(uid, message, source)
  }
  send (uid, message) {
    var port = this.connections[uid].port
    if (port != null) {
      port.postMessage({
        type: 'message',
        room: this.swOptions.room,
        message: message,
        guid: uid
      })
    } else {
      super.send(uid, message)
    }
  }
  broadcast (message, exclude) {
    for (var uid in this.connections) {
      if (uid !== exclude) {
        this.send(uid, message)
      }
    }
  }
}
Y.extend('webworker', WebworkerConnector)

var instances = {}

var messageHandler = event => {
  if (event.data.room != null && event.data.type === 'join') {
    if (instances[event.data.room] == null) {
      instances[event.data.room] = Y({
        connector: {
          name: 'webworker',
          room: event.data.room,
          auth: event.data.auth
        },
        db: DBConfig
      })
    }
    instances[event.data.room].then(y => {
      var port = event.target
      port.postMessage({
        type: 'join',
        room: event.data.room,
        guid: event.data.guid
      })
      y.connector.userJoined(event.data.guid, 'slave', port)
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
}

onconnect = event => {
  var port = event.ports[0]
  port.addEventListener('message', messageHandler)
  port.start()
}
