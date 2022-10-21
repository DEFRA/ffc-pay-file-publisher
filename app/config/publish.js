const Joi = require('joi')

// Define config schema
const schema = Joi.object({
  totalRetries: Joi.boolean().default(6)
})

// Build config
const config = {
  totalRetries: process.env.TOTAL_RETRIES
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The publishing config is invalid. ${result.error.message}`)
}

module.exports = result.value
