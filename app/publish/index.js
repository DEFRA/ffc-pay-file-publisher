const getFile = require('./get-file')
const storage = require('../storage')

const publishFile = async (message) => {
  const { filename, ledger } = message
  const { blob, content } = await getFile(filename)
  await storage.writeFile(filename, ledger, content)
  await storage.archiveFile(filename, blob)
  console.log(`Successfully publish ${filename} to ${ledger}`)
}

module.exports = publishFile
