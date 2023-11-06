const getFile = require('./get-file')
const storage = require('../storage')
const { sendProcessFailureEvent } = require('../event')

const publishFile = async (message) => {
  const { filename, ledger } = message
  const { blob, content } = await getFile(filename)
  const result = await storage.writeFile(filename, ledger, content)
  if (result === true) {
    await storage.archiveFile(filename, blob)
    console.log(`Successfully published ${filename} to ${ledger}`)
  } else {
    await sendProcessFailureEvent(filename, result)
    console.error(`Error accessing DAX whilst sending ${filename}: ${result.message}`)
  }
}

module.exports = publishFile
