const retry = require('../retry')
const storage = require('../storage')

const getFile = async (filename) => {
  return retry(() => storage.getFile(filename))
}

module.exports = getFile
