jest.mock('../../../app/storage')
const mockStorage = require('../../../app/storage')
jest.mock('../../../app/publish/get-file')
const mockGetFile = require('../../../app/publish/get-file')
jest.mock('../../../app/event/send-process-failure-event')
const sendProcessFailureEvent = require('../../../app/event/send-process-failure-event')
const { AP } = require('../../../app/ledgers')
const publish = require('../../../app/publish')

const FILE_NAME = 'filename.csv'
const FILE_CONTENT = 'file content'

let message
let blob
let err

describe('publish', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetFile.mockResolvedValue({ blob, content: FILE_CONTENT })

    message = {
      filename: FILE_NAME,
      ledger: AP
    }

    blob = {}

    err = { status: 404, message: 'Error, write file failed' }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should get file with filename from message', async () => {
    mockStorage.writeFile.mockResolvedValue(true)
    await publish(message)
    expect(mockGetFile).toHaveBeenCalledWith(FILE_NAME)
  })

  test('should write file with filename, ledger and content to storage', async () => {
    mockStorage.writeFile.mockResolvedValue(true)
    await publish(message)
    expect(mockStorage.writeFile).toHaveBeenCalledWith(FILE_NAME, AP, FILE_CONTENT)
  })

  test('should archive file with filename and blob to storage', async () => {
    mockStorage.writeFile.mockResolvedValue(true)
    await publish(message)
    expect(mockStorage.archiveFile).toHaveBeenCalledWith(FILE_NAME, blob)
  })

  test('should not archive file with filename and blob to storage, if writeFile fails with error', async () => {
    mockStorage.writeFile.mockResolvedValue(err)
    await publish(message)
    expect(mockStorage.archiveFile).not.toHaveBeenCalled()
  })

  test('should call sendProcessFailureEvent, if writeFile fails with error', async () => {
    mockStorage.writeFile.mockResolvedValue(err)
    await publish(message)
    expect(sendProcessFailureEvent).toHaveBeenCalledWith(FILE_NAME, err)
  })

  test('should log success message', async () => {
    mockStorage.writeFile.mockResolvedValue(true)
    console.log = jest.fn()
    await publish(message)
    expect(console.log).toHaveBeenCalledWith(`Successfully published ${FILE_NAME} to ${AP}`)
  })

  test('should not log success message if writeFile fails', async () => {
    mockStorage.writeFile.mockResolvedValue(err)
    console.log = jest.fn()
    await publish(message)
    expect(console.log).not.toHaveBeenCalledWith(`Successfully published ${FILE_NAME} to ${AP}`)
  })

  test('should log failure message if writeFile fails', async () => {
    mockStorage.writeFile.mockResolvedValue(err)
    console.error = jest.fn()
    await publish(message)
    expect(console.error).toHaveBeenCalledWith(`Error accessing DAX whilst sending ${FILE_NAME}: ${err.message}`)
  })
})
