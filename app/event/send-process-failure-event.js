const messagingConfig = require('../config/message')
const publishConfig = require('../config/publish')
const { EventPublisher } = require('ffc-pay-event-publisher')

const sendProcessFailureEvent = async (filename, error) => {
  if (publishConfig.useEvents) {
    const event = {
      source: 'ffc-pay-file-publisher',
      type: 'uk.gov.defra.ffc.pay.warning.dax.unavailable',
      subject: filename,
      data: {
        message: error.message,
        filename
      }
    }
    const eventPublisher = new EventPublisher(messagingConfig.eventsTopic)
    await eventPublisher.publishEvent(event)
  }
}

module.exports = sendProcessFailureEvent
