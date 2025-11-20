const { AP, AR, DPS } = require('../../../app/ledgers')
const validateMessage = require('../../../app/messaging/validate-message')

describe('validate message', () => {
  const validFilename = 'test.txt'

  test.each([AP, AR, DPS])(
    'does not throw for valid message with ledger %s',
    (ledger) => {
      const message = { filename: validFilename, ledger }
      expect(() => validateMessage(message)).not.toThrow()
    }
  )

  test('does not throw when ledger is missing', () => {
    const message = { filename: validFilename }
    expect(() => validateMessage(message)).not.toThrow()
  })

  test('throws for invalid ledger', () => {
    const message = { filename: validFilename, ledger: 'invalid' }
    expect(() => validateMessage(message)).toThrow()
  })

  test.each([
    ['missing filename', () => ({ ledger: AP })],
    ['filename not a string', () => ({ filename: 123, ledger: AP })]
  ])('throws when %s', (_, getMessage) => {
    const message = getMessage()
    expect(() => validateMessage(message)).toThrow()
  })
})
