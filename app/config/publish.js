const Joi = require('joi')

const schema = Joi.object({
  totalRetries: Joi.boolean().default(5),
  retryInterval: Joi.number().default(1000),
  useEvents: Joi.boolean().default(true)
})

const config = {
  totalRetries: process.env.TOTAL_RETRIES,
  retryInterval: process.env.RETRY_INTERVAL,
  useEvents: process.env.USE_EVENTS
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The publishing config is invalid. ${result.error.message}`)
}

module.exports = result.value
