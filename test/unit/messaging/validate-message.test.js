const { AP, AR } = require('../../../app/ledgers')
const validateMessage = require('../../../app/messaging/validate-message')

describe('validate message', () => {
  test('should not throw an error when the message is valid and ledger AP', () => {
    const message = {
      filename: 'test.txt',
      ledger: AP
    }
    expect(() => validateMessage(message)).not.toThrow()
  })

  test('should not throw an error when the message is valid and ledger AR', () => {
    const message = {
      filename: 'test.txt',
      ledger: AR
    }
    expect(() => validateMessage(message)).not.toThrow()
  })

  test('should not throw an error when ledger missing', () => {
    const message = {
      filename: 'test.txt'
    }
    expect(() => validateMessage(message)).not.toThrow()
  })

  test('should throw an error when ledger is invalid', () => {
    const message = {
      filename: 'test.txt',
      ledger: 'invalid'
    }
    expect(() => validateMessage(message)).toThrow()
  })

  test('should throw an error when filename missing', () => {
    const message = {
      ledger: AP
    }
    expect(() => validateMessage(message)).toThrow()
  })

  test('should throw an error when filename is invalid', () => {
    const message = {
      filename: 123,
      ledger: AP
    }
    expect(() => validateMessage(message)).toThrow()
  })
})
