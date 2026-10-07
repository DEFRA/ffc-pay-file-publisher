const mockPublishConfig = { totalRetries: 1, enabled: true }

jest.mock('../../../app/config/publish', () => mockPublishConfig)
jest.mock('../../../app/publish', () => jest.fn())
jest.mock('../../../app/event', () => ({ sendProcessFailureEvent: jest.fn() }))

const publishFile = require('../../../app/publish')
const { sendProcessFailureEvent } = require('../../../app/event')

const { AP } = require('../../../app/ledgers')
const processSendMessage = require('../../../app/messaging/process-send-message')
let message
let receiver

describe('process send message', () => {
  beforeEach(() => {
    receiver = { completeMessage: jest.fn(), deadLetterMessage: jest.fn() }
    message = { body: { filename: 'filename.csv', ledger: AP } }
    mockPublishConfig.enabled = true
    publishFile.mockResolvedValue()
    jest.clearAllMocks()
  })

  test('completes valid message', async () => {
    await processSendMessage(message, receiver)
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('publishes file from message body', async () => {
    await processSendMessage(message, receiver)
    expect(publishFile).toHaveBeenCalledWith(message.body)
  })

  test('does not complete message and triggers send process failure event when publish fails', async () => {
    const error = new Error('fail')
    publishFile.mockRejectedValue(error)

    await processSendMessage(message, receiver)

    expect(receiver.completeMessage).not.toHaveBeenCalled()
    expect(sendProcessFailureEvent).toHaveBeenCalledWith(message.body.filename, error)
  })

  test('does not call publishFile if publishing is disabled', async () => {
    mockPublishConfig.enabled = false

    await processSendMessage(message, receiver)

    expect(publishFile).not.toHaveBeenCalled()
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('dead-letters message when RestError with BlobNotFound', async () => {
    const restErr = { name: 'RestError', details: { errorCode: 'BlobNotFound' } }
    publishFile.mockRejectedValue(restErr)

    await processSendMessage(message, receiver)

    expect(receiver.completeMessage).not.toHaveBeenCalled()
    expect(receiver.deadLetterMessage).toHaveBeenCalledWith(message)
    expect(sendProcessFailureEvent).toHaveBeenCalledWith(message.body.filename, restErr)
  })

  test('handles validation failures without publishing', async () => {
    const invalidMessage = { body: { filename: 'filename.csv', ledger: 'invalid' } }

    await processSendMessage(invalidMessage, receiver)

    expect(publishFile).not.toHaveBeenCalled()
    expect(receiver.completeMessage).not.toHaveBeenCalled()
    expect(sendProcessFailureEvent).toHaveBeenCalledWith(invalidMessage.body.filename, expect.any(Error))
  })
})
