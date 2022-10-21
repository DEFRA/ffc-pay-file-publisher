const publishFile = require('../publish')

const processSendMessage = async (message, receiver) => {
  try {
    await publishFile(message.body)
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process message:', err)
  }
}

module.exports = processSendMessage
