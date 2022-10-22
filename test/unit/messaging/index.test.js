jest.mock('ffc-messaging')
const messageService = require('../../../app/messaging')

describe('messaging', () => {
  afterAll(async () => {
    await messageService.stop()
  })

  test('runs', async () => {
    await messageService.start()
  })
})
