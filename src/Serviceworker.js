/* global Y */
'use strict'

// Thx to @jed for this script https://gist.github.com/jed/982883
function generateGuid(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,generateGuid)} // eslint-disable-line

function extend (Y) {
  class Serviceworker extends Y.AbstractConnector {
    constructor (y, options) {
      var self = this
      if (options === undefined) {
        throw new Error('Options must not be undefined!')
      }
      if (options.room == null) {
        throw new Error('You must define a room name!')
      }
      if (options.scope == null) {
        throw new Error('You must specify the scope of the service worker')
      }
      options.role = 'slave'
      this.options = options
      super(y, options)
      navigator.serviceWorker.addEventListener('message', function (event) {
        debugger
        if (event.room === options.room && event.type === 'message') {
          self.receiveMessage('serviceworker', event.message)
        }
      })
      var registration = navigator.serviceWorker.getRegistration(options.scope)
      if (registration == null) {
        throw new Error('You must register a service worker with the specified scope (' + options.scope + ')!')
      }
      this.sw = registration.installing || registration.waiting || registration.active
      function start () {
        if (self.sw.state === 'activated') {
          self.sw.postMessage({
            type: 'join',
            room: options.room,
            options: options
          })
          self.userJoined('serviceworker', 'master')
          self.setUserId(generateGuid())
          self.sw.removeEventListener('statechange', start)
        }
      }
      this.sw.addEventListener('statechange', start)
      start()
    }
    disconnect () {
      this.sw.postMessage({
        type: 'leave',
        room: this.options.room
      })
      super.disconnect()
    }
    reconnect () {
      self.sw.postMessage({
        type: 'join',
        room: this.options.room,
        options: this.options
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
        message: message
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
