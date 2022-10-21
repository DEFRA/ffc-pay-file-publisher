require('./insights').setup()
require('log-timestamp')
const messaging = require('./messaging')
const storage = require('./storage')

process.on(['SIGTERM', 'SIGINT', 'SIGKILL'], async () => {
  await messaging.stop()
  process.exit(0)
})

module.exports = (async () => {
  storage.connect()
  await messaging.start()
})()
