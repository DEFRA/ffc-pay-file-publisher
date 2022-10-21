const retry = require('../retry')
const storage = require('../storage')

const getFile = async (context, filename) => {
  return retry(() => storage.getFile(context, filename))
}

module.exports = getFile
