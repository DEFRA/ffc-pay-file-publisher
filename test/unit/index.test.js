jest.mock('../../app/insights', () => ({ setup: jest.fn() }))

jest.mock('../../app/messaging', () => ({
  start: jest.fn().mockResolvedValue(),
  stop: jest.fn().mockResolvedValue()
}))

const messaging = require('../../app/messaging')

describe('app', () => {
  let mockExit

  beforeAll(() => {
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})
    require('../../app')
  })

  afterAll(() => {
    mockExit.mockRestore()
  })

  test('starts messaging once', () => {
    expect(messaging.start).toHaveBeenCalledTimes(1)
  })

  test.each(['SIGTERM', 'SIGINT'])('stops messaging on %s', async (signal) => {
    messaging.stop.mockClear()
    mockExit.mockClear()

    process.emit(signal)

    await new Promise(resolve => setImmediate(resolve))

    expect(messaging.stop).toHaveBeenCalledTimes(1)
    expect(mockExit).toHaveBeenCalledWith(0)
  })
})
