const Joi = require('joi')

const schema = Joi.object({
  totalRetries: Joi.boolean().default(5),
  retryInterval: Joi.number().default(1000)
})

const config = {
  totalRetries: process.env.TOTAL_RETRIES,
  retryInterval: process.env.RETRY_INTERVAL
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The publishing config is invalid. ${result.error.message}`)
}

module.exports = result.value
