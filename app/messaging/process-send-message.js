const publishFile = require('../publish')
const validateMessage = require('./validate-message')

const processSendMessage = async (message, receiver) => {
  try {
    validateMessage(message.body)
    await publishFile(message.body)
    await receiver.completeMessage(message)
  } catch (err) {
    await receiver.abandonMessage(message)
    console.error('Unable to process message:', err)
  }
}

module.exports = processSendMessage
