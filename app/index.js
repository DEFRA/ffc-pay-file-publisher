require('./insights').setup()
require('log-timestamp')
const messaging = require('./messaging')

;['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, async () => {
    await messaging.stop()
    process.exit(0)
  })
})

module.exports = (async () => {
  await messaging.start()
})()
