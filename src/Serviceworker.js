/* global Y */
'use strict'

// Thx to @jed for this script https://gist.github.com/jed/982883
function generateGuid(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,generateGuid)} // eslint-disable-line

function extend (Y) {
  class Serviceworker extends Y.AbstractConnector {
    constructor (y, options) {
      if (options === undefined) {
        throw new Error('Options must not be undefined!')
      }
      if (options.room == null) {
        throw new Error('You must define a room name!')
      }
      options.serviceworker = options.serviceworker || window['yjs-service-worker']
      if (options.serviceworker == null) {
        throw new Error('You must specify the service worker!')
      }
      options.role = 'slave'
      super(y, options)
      this.y.db.stopGarbageCollector()
      this.options = options
      this.guid = generateGuid() // we send this unique id with every postMessage. Later it becomes the userId
      var self = this
      this.messageEventListener = function (event) {
        if (event.data.room === options.room && (event.data.guid == null || event.data.guid === self.guid)) {
          if (event.data.type === 'message') {
            self.receiveMessage('serviceworker', JSON.parse(JSON.stringify(event.data.message)))
          }
          if (event.data.type === 'join') {
            if (self.connections['serviceworker'] == null) {
              self.userJoined('serviceworker', 'master')
              self.whenSynced(function () {
                self.setUserId(self.guid)
              })
            }
          }
        }
      }
      navigator.serviceWorker.addEventListener('message', this.messageEventListener)

      this.options.serviceworker.then(function (registration) {
        if (registration == null) {
          throw new Error('You must register a service worker with the specified scope (' + options.scope + ')!')
        }
        self.sw = registration.active || registration.waiting || registration.installing
        function start () {
          if (self.sw.state === 'activated') {
            self.sw.postMessage({
              type: 'join',
              room: options.room,
              auth: options.auth,
              guid: self.guid
            })
            self.sw.removeEventListener('statechange', start)
          }
        }
        self.sw.addEventListener('statechange', start)
        start()
      }, function (err) {
        throw err
      })
    }
    destroy () {
      
    }
    disconnect () {
      this.removeEventListener('message', this.messageEventListener)
      this.userLeft('serviceworker')
      this.sw.postMessage({
        type: 'leave',
        room: this.options.room,
        guid: this.guid
      })
      super.disconnect()
    }
    reconnect () {
      this.addEventListener('message', this.messageEventListener)
      this.sw.postMessage({
        type: 'join',
        room: this.options.room,
        auth: this.authInfo,
        guid: this.guid
      })
      super.reconnect()
    }
    send (uid, message) {
      this.broadcast(message)
    }
    broadcast (message) {
      this.sw.postMessage({
        type: 'message',
        room: this.options.room,
        message: message,
        guid: this.guid
      })
    }
    isDisconnected () {
      return false
    }
  }
  Y.extend('serviceworker', Serviceworker)
}

module.exports = extend
if (typeof Y !== 'undefined') {
  extend(Y)
}
