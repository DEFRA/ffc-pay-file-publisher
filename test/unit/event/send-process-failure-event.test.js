const mockPublishEvent = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => ({
  publishEvent: mockPublishEvent
}))

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: MockEventPublisher
}))

const messagingConfig = require('../../../app/config/message')
const publishConfig = require('../../../app/config/publish')
const sendProcessFailureEvent = require('../../../app/event/send-process-failure-event')

let error
const filename = 'FFCSFI_0001_AP_20231109165324 (SITI_SFI).csv'

describe('Error event', () => {
  beforeEach(() => {
    error = { message: 'Cannot reach DAX' }
    publishConfig.useEvents = true
    messagingConfig.eventsTopic = 'events'
  })

  afterEach(() => jest.clearAllMocks())

  test('should send event if events enabled', async () => {
    await sendProcessFailureEvent(filename, error)
    expect(mockPublishEvent).toHaveBeenCalled()
  })

  test('should not send event if events disabled', async () => {
    publishConfig.useEvents = false
    await sendProcessFailureEvent(filename, error)
    expect(mockPublishEvent).not.toHaveBeenCalled()
  })

  test('should send event to correct topic', async () => {
    await sendProcessFailureEvent(filename, error)
    expect(MockEventPublisher).toHaveBeenCalledWith(messagingConfig.eventsTopic)
  })

  test.each([
    ['source', 'ffc-pay-file-publisher'],
    ['type', 'uk.gov.defra.ffc.pay.warning.dax.unavailable'],
    ['data.message', 'Cannot reach DAX']
  ])('should set event %s correctly', async (prop, expected) => {
    await sendProcessFailureEvent(filename, error)
    const eventArg = mockPublishEvent.mock.calls[0][0]
    const actual = prop.split('.').reduce((obj, key) => obj[key], eventArg)
    expect(actual).toBe(expected)
  })
})
