const schema = require('../messaging/schema')

const validateMessage = async (message) => {
  const result = schema.validate(message, { abortEarly: false })
  if (result.error) {
    const errMessage = `The message schema is invalid. ${result.error.message}`
    console.log(errMessage)
    throw new Error(errMessage)
  }
}

module.exports = validateMessage
