require('./insights').setup()
require('log-timestamp')
const messaging = require('./messaging')

process.on(['SIGTERM', 'SIGINT', 'SIGKILL'], async () => {
  await messaging.stop()
  process.exit(0)
})

module.exports = (async () => {
  await messaging.start()
})()
