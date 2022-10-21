const joi = require('joi')

const mqSchema = joi.object({
  messageQueue: {
    host: joi.string(),
    username: joi.string(),
    password: joi.string(),
    useCredentialChain: joi.bool().default(false),
    type: joi.string().default('subscription'),
    appInsights: joi.object()
  },
  sendSubscription: {
    address: joi.string(),
    topic: joi.string()
  }
})
const mqConfig = {
  messageQueue: {
    host: process.env.MESSAGE_QUEUE_HOST,
    username: process.env.MESSAGE_QUEUE_USER,
    password: process.env.MESSAGE_QUEUE_PASSWORD,
    useCredentialChain: process.env.NODE_ENV === 'production',
    type: 'subscription',
    appInsights: process.env.NODE_ENV === 'production' ? require('applicationinsights') : undefined
  },
  submitSubscription: {
    address: process.env.SEND_SUBSCRIPTION_ADDRESS,
    topic: process.env.SEND_TOPIC_ADDRESS
  }
}

const mqResult = mqSchema.validate(mqConfig, {
  abortEarly: false
})

// Throw if config is invalid
if (mqResult.error) {
  throw new Error(`The message queue config is invalid. ${mqResult.error.message}`)
}

const submitSubscription = { ...mqResult.value.messageQueue, ...mqResult.value.submitSubscription }

module.exports = {
  submitSubscription
}
