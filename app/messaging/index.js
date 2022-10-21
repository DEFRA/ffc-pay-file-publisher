const config = require('../config/message')
const processSendMessage = require('./process-send-message')
const { MessageReceiver } = require('ffc-messaging')
let receiver

const start = async () => {
  const action = message => processSendMessage(message, receiver)
  receiver = new MessageReceiver(config.sendSubscription, action)
  await receiver.subscribe()
  console.info('Ready to publish files')
}

const stop = async () => {
  await receiver.closeConnection()
}

module.exports = { start, stop }
