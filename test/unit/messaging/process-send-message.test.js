jest.mock('../../../app/config/publish', () => ({ totalRetries: 1 }))
jest.mock('../../../app/event/send-process-failure-event')
const mockSendProcessFailureEvent = require('../../../app/event/send-process-failure-event')
const config = require('../../../app/config/storage')
const mockContent = 'content'
const mockGetContainerClient = jest.fn()
const mockBlob = {
  downloadToBuffer: jest.fn().mockResolvedValue(Buffer.from(mockContent)),
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
jest.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: {
      fromConnectionString: jest.fn().mockReturnValue(mockBlobServiceClient)
    }
  }
})
const mockGetShareClient = jest.fn()
const mockFile = {
  create: jest.fn(),
  uploadRange: jest.fn()
}
const mockFolder = {
  getFileClient: jest.fn().mockReturnValue(mockFile)
}
const mockShare = {
  getDirectoryClient: jest.fn().mockReturnValue(mockFolder)
}
const mockShareServiceClient = {
  getShareClient: mockGetShareClient.mockReturnValue(mockShare)
}
jest.mock('@azure/storage-file-share', () => {
  return {
    ShareServiceClient: {
      fromConnectionString: jest.fn().mockReturnValue(mockShareServiceClient)
    }
  }
})
let message

const { AP } = require('../../../app/ledgers')
const processSendMessage = require('../../../app/messaging/process-send-message')
let receiver

describe('process send message', () => {
  beforeEach(() => {
    receiver = {
      completeMessage: jest.fn()
    }

    message = {
      body: {
        filename: 'filename.csv',
        ledger: AP
      }
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('completes valid message', async () => {
    await processSendMessage(message, receiver)
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('gets blob with filename from message', async () => {
    await processSendMessage(message, receiver)
    expect(mockContainer.getBlockBlobClient.mock.calls[0][0]).toBe(`${config.outboundFolder}/${message.body.filename}`)
  })

  test('downloads blob once', async () => {
    await processSendMessage(message, receiver)
    expect(mockBlob.downloadToBuffer).toHaveBeenCalledTimes(1)
  })

  test('gets share with folder name from message', async () => {
    await processSendMessage(message, receiver)
    expect(mockShare.getDirectoryClient.mock.calls[0][0]).toBe(config.apFolder)
  })

  test('gets file with filename from message', async () => {
    await processSendMessage(message, receiver)
    expect(mockFolder.getFileClient.mock.calls[0][0]).toBe(message.body.filename)
  })

  test('creates file once', async () => {
    await processSendMessage(message, receiver)
    expect(mockFile.create).toHaveBeenCalledTimes(1)
  })

  test('uploads file once', async () => {
    await processSendMessage(message, receiver)
    expect(mockFile.uploadRange).toHaveBeenCalledTimes(1)
  })

  test('uploads file with content from blob', async () => {
    await processSendMessage(message, receiver)
    expect(mockFile.uploadRange.mock.calls[0][0]).toBe(mockContent)
  })

  test('gets blob to archive filename from message', async () => {
    await processSendMessage(message, receiver)
    expect(mockContainer.getBlockBlobClient.mock.calls[1][0]).toBe(`${config.archiveFolder}/${message.body.filename}`)
  })

  test('deletes blob once', async () => {
    await processSendMessage(message, receiver)
    expect(mockBlob.delete).toHaveBeenCalledTimes(1)
  })

  test('does not complete message if blob download fails', async () => {
    mockBlob.downloadToBuffer.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(receiver.completeMessage).not.toHaveBeenCalled()
  })

  test('does not complete message if file upload fails', async () => {
    mockFile.uploadRange.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(receiver.completeMessage).not.toHaveBeenCalled()
  })

  test('does not complete message if blob delete fails', async () => {
    mockBlob.delete.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(receiver.completeMessage).not.toHaveBeenCalled()
  })

  test('does not complete message if file create fails', async () => {
    mockFile.create.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(receiver.completeMessage).not.toHaveBeenCalled()
  })

  test('does not complete message if blob copy fails', async () => {
    mockBlob.beginCopyFromURL.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(receiver.completeMessage).not.toHaveBeenCalled()
  })

  test('does not complete message if blob upload fails', async () => {
    mockBlob.upload.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(receiver.completeMessage).not.toHaveBeenCalled()
  })

  test('triggers send process failure event if blob download fails', async () => {
    mockBlob.downloadToBuffer.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(mockSendProcessFailureEvent).toHaveBeenCalled()
  })

  test('triggers send process failure event if file upload fails', async () => {
    mockFile.uploadRange.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(mockSendProcessFailureEvent).toHaveBeenCalled()
  })

  test('triggers send process failure event if blob delete fails', async () => {
    mockBlob.delete.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(mockSendProcessFailureEvent).toHaveBeenCalled()
  })

  test('triggers send process failure event if file create fails', async () => {
    mockFile.create.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(mockSendProcessFailureEvent).toHaveBeenCalled()
  })

  test('triggers send process failure event if blob copy fails', async () => {
    mockBlob.beginCopyFromURL.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(mockSendProcessFailureEvent).toHaveBeenCalled()
  })

  test('triggers send process failure event if blob upload fails', async () => {
    mockBlob.upload.mockRejectedValue(new Error('error'))
    await processSendMessage(message, receiver)
    expect(mockSendProcessFailureEvent).toHaveBeenCalled()
  })
})
