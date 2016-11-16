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
      if (options.serviceworker == null) {
        throw new Error('You must specify a service worker')
      }
      options.role = 'slave'
      super(y, options)
      this.options = options
      var self = this
      navigator.serviceWorker.addEventListener('message', function (event) {
        if (event.data.room === options.room && event.data.type === 'message') {
          self.receiveMessage('serviceworker', event.data.message)
        }
        if (event.data.room === options.room && event.data.type === 'join') {
          self.userJoined('serviceworker', 'master')
          self.setUserId(generateGuid())
        }
      })

      this.options.serviceworker.then(function (registration) {
        if (registration == null) {
          throw new Error('You must register a service worker with the specified scope (' + options.scope + ')!')
        }
        self.sw = registration.installing || registration.waiting || registration.active
        function start () {
          if (self.sw.state === 'activated') {
            self.sw.postMessage({
              type: 'join',
              room: options.room,
              options: options
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
    disconnect () {
      this.sw.postMessage({
        type: 'leave',
        room: this.options.room
      })
      super.disconnect()
    }
    reconnect () {
      this.sw.postMessage({
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
