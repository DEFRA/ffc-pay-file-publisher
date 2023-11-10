const mockPublishEvent = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => {
  return {
    publishEvent: mockPublishEvent
  }
})

jest.mock('ffc-pay-event-publisher', () => {
  return {
    EventPublisher: MockEventPublisher
  }
})

const messagingConfig = require('../../../app/config/message')
const publishConfig = require('../../../app/config/publish')

const sendProcessFailureEvent = require('../../../app/event/send-process-failure-event')

let error
const filename = 'FFCSFI_0001_AP_20231109165324 (SITI_SFI).csv'

describe('Error event', () => {
  beforeEach(() => {
    error = {
      message: 'Cannot reach DAX'
    }

    publishConfig.useEvents = true
    messagingConfig.eventsTopic = 'events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send event if events enabled', async () => {
    await sendProcessFailureEvent(filename, error)
    expect(mockPublishEvent).toHaveBeenCalled()
  })

  test('should not send event if events disabled', async () => {
    publishConfig.useEvents = false
    await sendProcessFailureEvent(filename, error)
    expect(mockPublishEvent).not.toHaveBeenCalled()
  })

  test('should send event to topic', async () => {
    await sendProcessFailureEvent(filename, error)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messagingConfig.eventsTopic)
  })

  test('should raise an event with file-publisher source', async () => {
    await sendProcessFailureEvent(filename, error)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe('ffc-pay-file-publisher')
  })

  test('should raise dax rejected event type', async () => {
    await sendProcessFailureEvent(filename, error)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe('uk.gov.defra.ffc.pay.warning.dax.unavailable')
  })

  test('should include error message in event data', async () => {
    await sendProcessFailureEvent(filename, error)
    expect(mockPublishEvent.mock.calls[0][0].data.message).toBe(error.message)
  })
})
