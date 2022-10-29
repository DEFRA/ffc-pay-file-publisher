jest.mock('../../../app/storage')
const mockStorage = require('../../../app/storage')
jest.mock('../../../app/publish/get-file')
const mockGetFile = require('../../../app/publish/get-file')
const { AP } = require('../../../app/ledgers')
const publish = require('../../../app/publish')

const FILE_NAME = 'filename.csv'
const FILE_CONTENT = 'file content'

let message
let blob

describe('publish', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetFile.mockResolvedValue({ blob, content: FILE_CONTENT })

    message = {
      filename: FILE_NAME,
      ledger: AP
    }

    blob = {}
  })

  test('should get file with filename from message', async () => {
    await publish(message)
    expect(mockGetFile).toHaveBeenCalledWith(FILE_NAME)
  })

  test('should write file with filename, ledger and content to storage', async () => {
    await publish(message)
    expect(mockStorage.writeFile).toHaveBeenCalledWith(FILE_NAME, AP, FILE_CONTENT)
  })

  test('should archive file with filename and blob to storage', async () => {
    await publish(message)
    expect(mockStorage.archiveFile).toHaveBeenCalledWith(FILE_NAME, blob)
  })

  test('should log success message', async () => {
    console.log = jest.fn()
    await publish(message)
    expect(console.log).toHaveBeenCalledWith(`Successfully publish ${FILE_NAME} to ${AP}`)
  })
})
