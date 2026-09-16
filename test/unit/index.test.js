jest.mock('../../app/messaging', () => ({
  start: jest.fn().mockResolvedValue(),
  stop: jest.fn().mockResolvedValue()
}))
const messaging = require('../../app/messaging')

describe('app', () => {
  beforeEach(() => {
    require('../../app')
  })

  test('starts messaging once', async () => {
    expect(messaging.start).toHaveBeenCalledTimes(1)
  })
})
