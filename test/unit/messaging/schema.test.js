const { AP, AR, DPS } = require('../../../app/ledgers')
const schema = require('../../../app/messaging/schema')

const FILE_NAME = 'filename.csv'
let message

describe('messaging schema', () => {
  beforeEach(() => {
    message = { filename: FILE_NAME, ledger: AP }
  })

  test.each([AP, AR, DPS])('validates message with ledger %s', (ledger) => {
    message.ledger = ledger
    const result = schema.validate(message)
    expect(result.error).toBeUndefined()
  })

  test('validates message when ledger is missing', () => {
    delete message.ledger
    const result = schema.validate(message)
    expect(result.error).toBeUndefined()
  })

  test('sets ledger to AP if missing', () => {
    delete message.ledger
    const result = schema.validate(message)
    expect(result.value.ledger).toBe(AP)
  })

  test('invalid ledger triggers error', () => {
    message.ledger = 'invalid'
    const result = schema.validate(message)
    expect(result.error).toBeDefined()
  })

  test.each([
    ['filename missing', () => delete message.filename],
    ['filename not a string', () => { message.filename = 123 }],
    ['filename empty', () => { message.filename = '' }]
  ])('%s triggers error', (_, mutate) => {
    mutate()
    const result = schema.validate(message)
    expect(result.error).toBeDefined()
  })
})
