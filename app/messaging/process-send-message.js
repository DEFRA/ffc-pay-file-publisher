const publishFile = require('../publish')
const validateMessage = require('./validate-message')
const { sendProcessFailureEvent } = require('../event')

const processSendMessage = async (message, receiver) => {
  try {
    validateMessage(message.body)
    await publishFile(message.body)
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process message:', err)
    await sendProcessFailureEvent(message.body.filename, err)
  }
}

module.exports = processSendMessage
