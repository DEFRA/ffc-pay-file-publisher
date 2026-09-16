const serviceBus = require('../../../../app/messaging/service-bus')

describe('service-bus barrel', () => {
  test('exports expected functions', () => {
    expect(serviceBus.createServiceBusClient).toBeDefined()
    expect(serviceBus.createServiceBusAdministrationClient).toBeDefined()
    expect(serviceBus.enrichMessage).toBeDefined()
    expect(serviceBus.sendMessage).toBeDefined()
    expect(serviceBus.sendBatchMessages).toBeDefined()
    expect(serviceBus.createReceiver).toBeDefined()
    expect(serviceBus.subscribeReceiver).toBeDefined()
    expect(serviceBus.retry).toBeDefined()
    expect(serviceBus.getSender).toBeDefined()
    expect(serviceBus.closeSenders).toBeDefined()
    expect(serviceBus.clearCache).toBeDefined()
  })
})
