const Joi = require('joi')
const { AP, AR, DPS } = require('../ledgers')

module.exports = Joi.object({
  filename: Joi.string().required(),
  ledger: Joi.string().valid(AP, AR, DPS).default(AP)
})
