jest.mock('../../../app/messaging/process-send-message', () => jest.fn())
jest.mock('../../../app/messaging/service-bus', () => ({
  createServiceBusClient: jest.fn(),
  createReceiver: jest.fn(),
  subscribeReceiver: jest.fn(),
  closeSenders: jest.fn()
}))

const config = require('../../../app/config/message')
const processSendMessage = require('../../../app/messaging/process-send-message')
const { createServiceBusClient, createReceiver, subscribeReceiver, closeSenders } = require('../../../app/messaging/service-bus')
const messageService = require('../../../app/messaging')

describe('messaging', () => {
  let sbClient
  let receiver

  beforeEach(() => {
    sbClient = { close: jest.fn() }
    receiver = { subscribe: jest.fn() }
    createServiceBusClient.mockReturnValue(sbClient)
    createReceiver.mockReturnValue(receiver)
    closeSenders.mockResolvedValue()
    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(async () => {
    await messageService.stop()
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('starts receiver for send subscription', async () => {
    await messageService.start()

    expect(createServiceBusClient).toHaveBeenCalledWith(config.sendSubscription)
    expect(createReceiver).toHaveBeenCalledWith(sbClient, config.sendSubscription)
    expect(subscribeReceiver).toHaveBeenCalledWith(
      receiver,
      processSendMessage,
      expect.any(Function),
      config.sendSubscription
    )
    expect(console.info).toHaveBeenCalledWith('Ready to publish files')
  })

  test('logs receive errors from subscription handler', async () => {
    const error = new Error('receive failed')

    await messageService.start()
    const errorHandler = subscribeReceiver.mock.calls[0][2]
    errorHandler(error)

    expect(console.error).toHaveBeenCalledWith('Error receiving message:', error)
  })

  test('stops service bus client and senders', async () => {
    await messageService.start()
    await messageService.stop()

    expect(sbClient.close).toHaveBeenCalledTimes(1)
    expect(closeSenders).toHaveBeenCalledTimes(1)
  })

  test('stops senders when service bus client has not started', async () => {
    await messageService.stop()

    expect(closeSenders).toHaveBeenCalledTimes(1)
  })

  test('logs client close errors and still closes senders', async () => {
    const error = new Error('close failed')
    sbClient.close.mockRejectedValue(error)

    await messageService.start()
    await messageService.stop()

    expect(console.error).toHaveBeenCalledWith('Error closing Service Bus client:', error)
    expect(closeSenders).toHaveBeenCalledTimes(1)
  })
})
