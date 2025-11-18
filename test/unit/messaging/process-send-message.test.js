jest.mock('../../../app/config/publish', () => ({ totalRetries: 1, enabled: true }))
jest.mock('../../../app/event/send-process-failure-event')

const mockSendProcessFailureEvent = require('../../../app/event/send-process-failure-event')
const config = require('../../../app/config/storage')
const mockContent = 'content'
const mockGetContainerClient = jest.fn()

const mockBlob = {
  downloadToBuffer: jest.fn().mockResolvedValue(mockContent),
  beginCopyFromURL: jest.fn().mockResolvedValue({ pollUntilDone: jest.fn().mockResolvedValue({ copyStatus: 'success' }) }),
  upload: jest.fn(),
  delete: jest.fn(),
  url: 'url'
}

const mockContainer = {
  getBlockBlobClient: jest.fn().mockReturnValue(mockBlob),
  createIfNotExists: jest.fn()
}

const mockBlobServiceClient = {
  getContainerClient: mockGetContainerClient.mockReturnValue(mockContainer)
}

jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: { fromConnectionString: jest.fn().mockReturnValue(mockBlobServiceClient) }
}))

const mockGetShareClient = jest.fn()
const mockFile = { create: jest.fn(), uploadRange: jest.fn() }
const mockFolder = { getFileClient: jest.fn().mockReturnValue(mockFile) }
const mockShare = { getDirectoryClient: jest.fn().mockReturnValue(mockFolder) }
const mockShareServiceClient = { getShareClient: mockGetShareClient.mockReturnValue(mockShare) }

jest.mock('@azure/storage-file-share', () => ({
  ShareServiceClient: { fromConnectionString: jest.fn().mockReturnValue(mockShareServiceClient) }
}))

const { AP } = require('../../../app/ledgers')
const processSendMessage = require('../../../app/messaging/process-send-message')
let message
let receiver

describe('process send message', () => {
  beforeEach(() => {
    receiver = { completeMessage: jest.fn() }
    message = { body: { filename: 'filename.csv', ledger: AP } }
    jest.clearAllMocks()
  })

  test('completes valid message', async () => {
    await processSendMessage(message, receiver)
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('downloads blob and uploads file correctly', async () => {
    await processSendMessage(message, receiver)
    expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith(`${config.outboundFolder}/${message.body.filename}`)
    expect(mockBlob.downloadToBuffer).toHaveBeenCalledTimes(1)
    expect(mockShare.getDirectoryClient).toHaveBeenCalledWith(config.apFolder)
    expect(mockFolder.getFileClient).toHaveBeenCalledWith(message.body.filename)
    expect(mockFile.create).toHaveBeenCalledTimes(1)
    expect(mockFile.uploadRange).toHaveBeenCalledWith(
      mockContent,
      expect.any(Number),
      expect.any(Number)
    )
  })

  test('archives and deletes blob correctly', async () => {
    await processSendMessage(message, receiver)
    expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith(`${config.archiveFolder}/${message.body.filename}`)
    expect(mockBlob.delete).toHaveBeenCalledTimes(1)
  })

  describe.each([
    ['blob download fails', () => mockBlob.downloadToBuffer.mockRejectedValue(new Error('fail'))],
    ['file upload fails', () => mockFile.uploadRange.mockRejectedValue(new Error('fail'))],
    ['blob delete fails', () => mockBlob.delete.mockRejectedValue(new Error('fail'))],
    ['file create fails', () => mockFile.create.mockRejectedValue(new Error('fail'))],
    ['blob copy fails', () => mockBlob.beginCopyFromURL.mockRejectedValue(new Error('fail'))],
    ['blob upload fails', () => mockBlob.upload.mockRejectedValue(new Error('fail'))]
  ])('failure scenarios: %s', (_, setupFailure) => {
    test('does not complete message and triggers send process failure event', async () => {
      setupFailure()
      await processSendMessage(message, receiver)
      expect(receiver.completeMessage).not.toHaveBeenCalled()
      expect(mockSendProcessFailureEvent).toHaveBeenCalled()
    })
  })

  test('does not call publishFile if enabled is false', async () => {
    const mockPublishFile = jest.fn()
    jest.mock('../../../app/config/publish', () => ({ enabled: false }))
    await processSendMessage(message, receiver)
    expect(mockPublishFile).not.toHaveBeenCalled()
  })
})
