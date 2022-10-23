const { AP, AR } = require('../../../app/ledgers')
const schema = require('../../../app/messaging/schema')
let message

const FILE_NAME = 'filename.csv'

describe('messaging schema', () => {
  beforeEach(() => {
    message = {
      filename: FILE_NAME,
      ledger: AP
    }
  })

  test('should include error when the message is valid and ledger AP', () => {
    const result = schema.validate(message)
    expect(result.error).toBeUndefined()
  })

  test('should include error when the message is valid and ledger AR', () => {
    message.ledger = AR
    const result = schema.validate(message)
    expect(result.error).toBeUndefined()
  })

  test('should include error when ledger missing', () => {
    delete message.ledger
    const result = schema.validate(message)
    expect(result.error).toBeUndefined()
  })

  test('should include error when ledger is invalid', () => {
    message.ledger = 'invalid'
    const result = schema.validate(message)
    expect(result.error).toBeDefined()
  })

  test('should include error when filename missing', () => {
    delete message.filename
    const result = schema.validate(message)
    expect(result.error).toBeDefined()
  })

  test('should include error when filename is invalid', () => {
    message.filename = 123
    const result = schema.validate(message)
    expect(result.error).toBeDefined()
  })

  test('should include error when filename is empty', () => {
    message.filename = ''
    const result = schema.validate(message)
    expect(result.error).toBeDefined()
  })

  test('should set ledger to AP if missing', () => {
    delete message.ledger
    const result = schema.validate(message)
    expect(result.value.ledger).toBe(AP)
  })
})
