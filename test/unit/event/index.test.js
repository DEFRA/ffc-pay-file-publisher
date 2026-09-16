const event = require('../../../app/event')

describe('event barrel', () => {
  test('exports sendProcessFailureEvent', () => {
    expect(event.sendProcessFailureEvent).toBeDefined()
    expect(typeof event.sendProcessFailureEvent).toBe('function')
  })
})
