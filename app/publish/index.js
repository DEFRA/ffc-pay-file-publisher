const transferFile = require('./transfer-file')
const validateMessage = require('./validate-message')

const publishFile = async (message) => {
  await validateMessage(message)
  await transferFile(message.filename, message.ledger)
}

module.exports = publishFile
