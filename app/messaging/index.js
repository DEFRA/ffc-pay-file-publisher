const config = require('../config/message')
const processSendMessage = require('./process-send-message')
const { createServiceBusClient, createReceiver, subscribeReceiver, closeSenders } = require('./service-bus')

let sbClient
let receiver

const start = async () => {
  sbClient = createServiceBusClient(config.sendSubscription)
  receiver = createReceiver(sbClient, config.sendSubscription)
  const errorHandler = (err) => console.error('Error receiving message:', err)

  subscribeReceiver(receiver, processSendMessage, errorHandler, config.sendSubscription)
  console.info('Ready to publish files')
}

const stop = async () => {
  if (sbClient) {
    try {
      await sbClient.close()
    } catch (err) {
      console.error('Error closing Service Bus client:', err)
    }
    sbClient = null
  }
  await closeSenders()
  receiver = null
}

module.exports = { start, stop }
