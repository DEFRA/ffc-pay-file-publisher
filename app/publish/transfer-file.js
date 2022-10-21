const getFile = require('./get-file')
const storage = require('../storage')

const transferFile = async (filename, ledger) => {
  const { blob, content } = await getFile(filename)
  await storage.writeFile(filename, ledger, content)
  await storage.archiveFile(filename, blob)
  console.log(`Successfully transferred ${filename} to ${ledger}`)
}

module.exports = transferFile
