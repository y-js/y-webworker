/* global Y, SharedWorker */
'use strict'

// Thx to @jed for this script https://gist.github.com/jed/982883
function generateGuid(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,generateGuid)} // eslint-disable-line

function extend (Y) {
  class WebWorker extends Y.AbstractConnector {
    constructor (y, options) {
      if (options === undefined) {
        throw new Error('Options must not be undefined!')
      }
      if (options.room == null) {
        throw new Error('You must define a room name!')
      }
      if (options.url == null) {
        throw new Error('You must specify a url to the web worker! (E.g. "bower_components/y-webworker/webworker.js")')
      }
      var webworker = new SharedWorker(options.url, 'Yjs Web Worker')
      options.role = 'slave'
      super(y, options)
      this.y.db.stopGarbageCollector()
      this.options = options
      this.guid = generateGuid() // we send this unique id with every postMessage. Later it becomes the userId
      var self = this
      this.webworker = webworker
      this.port = webworker.port
      this.port.start()
      this.messageEventListener = function (event) {
        if (event.data.room === options.room && (event.data.guid == null || event.data.guid === self.guid)) {
          if (event.data.type === 'message') {
            self.receiveMessage('webworker', event.data.message)
          }
          if (event.data.type === 'join') {
            if (self.connections['webworker'] == null) {
              self.userJoined('webworker', 'master')
              self.whenSynced(function () {
                self.setUserId(self.guid)
              })
            }
          }
        }
      }
      this.port.addEventListener('message', this.messageEventListener)
      this.port.postMessage({
        type: 'join',
        room: options.room,
        auth: options.auth,
        guid: self.guid
      })
    }
    destroy () {
      this.port.removeEventListener('message', this.messageEventListener)
      this.userLeft('webworker')
      this.port.postMessage({
        type: 'leave',
        room: this.options.room,
        guid: this.guid
      })
    }
    disconnect () {
      // do nothing
    }
    reconnect () {
      // do nothing
    }
    send (uid, message) {
      this.broadcast(message)
    }
    broadcast (message) {
      this.port.postMessage({
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
  Y.extend('webworker', WebWorker)
}

module.exports = extend
if (typeof Y !== 'undefined') {
  extend(Y)
}
