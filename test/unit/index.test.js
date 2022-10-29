jest.mock('../../app/messaging')
const messaging = require('../../app/messaging')

describe('app', () => {
  beforeEach(() => {
    require('../../app')
  })

  test('starts messaging once', async () => {
    expect(messaging.start).toHaveBeenCalledTimes(1)
  })
})
