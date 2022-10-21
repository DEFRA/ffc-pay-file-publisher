const Joi = require('joi')

// Define config schema
const schema = Joi.object({
  connectionStr: Joi.string().when('useConnectionStr', { is: true, then: Joi.required(), otherwise: Joi.allow('').optional() }),
  storageAccount: Joi.string().required(),
  useConnectionStr: Joi.boolean().default(false),
  createContainers: Joi.boolean().default(false),
  container: Joi.string().required(),
  inboundFolder: Joi.string().required(),
  archiveFolder: Joi.string().required(),
  shareConnectionString: Joi.string().required(),
  shareName: Joi.string().required(),
  apFolder: Joi.string().required(),
  arFolder: Joi.string().required()
})

// Build config
const config = {
  connectionStr: process.env.AZURE_STORAGE_CONNECTION_STRING,
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  useConnectionStr: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
  createContainers: process.env.AZURE_STORAGE_CREATE_CONTAINERS,
  containerName: 'dax',
  outboundFolder: 'outbound',
  archiveFolder: 'archive',
  shareConnectionString: process.env.DAX_STORAGE_CONNECTION_STRING,
  shareName: process.env.DAX_STORAGE_SHARE_NAME,
  apFolder: process.env.AP_FOLDER,
  arFolder: process.env.AR_FOLDER
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The blob storage config is invalid. ${result.error.message}`)
}

module.exports = result.value
