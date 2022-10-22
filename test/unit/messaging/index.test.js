jest.mock('ffc-messaging')
jest.mock('../../../app/storage')
jest.mock('../../../app/publish')
const messageService = require('../../../app/messaging')

describe('messaging', () => {
  afterAll(async () => {
    await messageService.stop()
  })

  test('runs', async () => {
    await messageService.start()
  })
})
