jest.mock('../../../app/storage')
const mockStorage = require('../../../app/storage')
jest.mock('../../../app/retry')
const mockRetry = require('../../../app/retry')

const getFile = require('../../../app/publish/get-file')

const FILE_NAME = 'filename.csv'
const FILE_CONTENT = 'file content'

describe('get file', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockRetry.mockImplementation((fn) => fn())

    mockStorage.getFile.mockResolvedValue(FILE_CONTENT)
  })

  test('should get file with filename from storage', async () => {
    await getFile(FILE_NAME)
    expect(mockStorage.getFile).toHaveBeenCalledWith(FILE_NAME)
  })

  test('should return file content', async () => {
    const result = await getFile(FILE_NAME)
    expect(result).toEqual(FILE_CONTENT)
  })
})
