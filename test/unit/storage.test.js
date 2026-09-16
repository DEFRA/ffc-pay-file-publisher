describe('BlobServiceClient initialization', () => {
  let consoleLogSpy
  let config
  let BlobServiceClient
  let DefaultAzureCredential

  beforeAll(() => {
    jest.doMock('@azure/storage-blob', () => {
      const getContainerClientMock = jest.fn()
      const fromConnectionStringMock = jest.fn().mockReturnValue({
        getContainerClient: getContainerClientMock
      })
      const BlobServiceClientMock = jest.fn().mockImplementation(() => ({
        getContainerClient: getContainerClientMock
      }))
      BlobServiceClientMock.fromConnectionString = fromConnectionStringMock
      return { BlobServiceClient: BlobServiceClientMock }
    })

    jest.doMock('@azure/identity', () => ({
      DefaultAzureCredential: jest.fn().mockImplementation((options) => ({
        type: 'DefaultAzureCredential',
        options
      }))
    }))
  })

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    config = {
      connectionStr: 'fake-connection-string',
      storageAccount: 'fakeaccount',
      useConnectionStr: true,
      createContainers: false,
      container: 'dax',
      outboundFolder: 'outbound',
      archiveFolder: 'archive',
      shareConnectionString: 'fake-share-connection-string',
      shareName: 'share',
      apFolder: 'ap',
      arFolder: 'ar',
      dpsFolder: 'dps',
      managedIdentityClientId: 'fake-managed-id'
    }
    jest.doMock('../../app/config/storage', () => config)
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    BlobServiceClient = require('@azure/storage-blob').BlobServiceClient
    DefaultAzureCredential = require('@azure/identity').DefaultAzureCredential
  })

  afterEach(() => {
    consoleLogSpy?.mockRestore()
    jest.clearAllMocks()
  })

  test('should use connection string when config.useConnectionStr is true', () => {
    config.useConnectionStr = true
    config.connectionStr = 'fake-connection-string'

    require('../../app/storage')

    expect(consoleLogSpy).toHaveBeenCalledWith('Using connection string for BlobServiceClient')
    expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(config.connectionStr)
  })

  test('should use DefaultAzureCredential when config.useConnectionStr is false', () => {
    config.useConnectionStr = false
    config.storageAccount = 'fakeaccount'
    config.managedIdentityClientId = 'fake-managed-id'

    require('../../app/storage')

    const expectedUri = `https://${config.storageAccount}.blob.core.windows.net`

    expect(consoleLogSpy).toHaveBeenCalledWith('Using DefaultAzureCredential for BlobServiceClient')
    expect(DefaultAzureCredential).toHaveBeenCalledWith({ managedIdentityClientId: config.managedIdentityClientId })
    expect(BlobServiceClient).toHaveBeenCalledWith(expectedUri,
      expect.objectContaining({
        type: 'DefaultAzureCredential',
        options: { managedIdentityClientId: config.managedIdentityClientId }
      })
    )
  })
})

describe('storage operations', () => {
  let storage
  let config
  let BlobServiceClient
  let mockBlob
  let mockContainer
  let mockBlobServiceClient
  let mockFile
  let mockFolder
  let mockShare
  let mockShareServiceClient

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockBlob = {
      downloadToBuffer: jest.fn().mockResolvedValue(Buffer.from('file content')),
      beginCopyFromURL: jest.fn().mockResolvedValue({
        pollUntilDone: jest.fn().mockResolvedValue({ copyStatus: 'success' })
      }),
      url: 'https://blob.url/outbound/file.csv',
      delete: jest.fn().mockResolvedValue(),
      upload: jest.fn().mockResolvedValue()
    }

    mockContainer = {
      getBlockBlobClient: jest.fn().mockReturnValue(mockBlob),
      createIfNotExists: jest.fn().mockResolvedValue()
    }

    mockBlobServiceClient = {
      getContainerClient: jest.fn().mockReturnValue(mockContainer)
    }

    mockFile = {
      create: jest.fn().mockResolvedValue(),
      uploadRange: jest.fn().mockResolvedValue()
    }

    mockFolder = {
      getFileClient: jest.fn().mockReturnValue(mockFile)
    }

    mockShare = {
      getDirectoryClient: jest.fn().mockReturnValue(mockFolder)
    }

    mockShareServiceClient = {
      getShareClient: jest.fn().mockReturnValue(mockShare)
    }

    config = {
      connectionStr: 'fake-connection-string',
      storageAccount: 'fakeaccount',
      useConnectionStr: true,
      createContainers: false,
      container: 'dax',
      outboundFolder: 'outbound',
      archiveFolder: 'archive',
      shareConnectionString: 'fake-share-connection-string',
      shareName: 'share',
      apFolder: 'ap',
      arFolder: 'ar',
      dpsFolder: 'dps',
      managedIdentityClientId: 'fake-managed-id'
    }

    jest.doMock('../../app/config/storage', () => config)

    jest.doMock('@azure/storage-blob', () => ({
      BlobServiceClient: {
        fromConnectionString: jest.fn().mockReturnValue(mockBlobServiceClient)
      }
    }))

    jest.doMock('@azure/storage-file-share', () => ({
      ShareServiceClient: {
        fromConnectionString: jest.fn().mockReturnValue(mockShareServiceClient)
      }
    }))

    jest.spyOn(console, 'log').mockImplementation(() => {})

    BlobServiceClient = require('@azure/storage-blob').BlobServiceClient
    storage = require('../../app/storage')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getFile', () => {
    test('downloads file from outbound folder', async () => {
      const result = await storage.getFile('file.csv')

      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/file.csv')
      expect(mockBlob.downloadToBuffer).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ blob: mockBlob, content: 'file content' })
    })

    test('creates fresh blob client when forceFresh is true', async () => {
      const freshBlob = { ...mockBlob }
      const freshContainer = {
        getBlockBlobClient: jest.fn().mockReturnValue(freshBlob)
      }
      const freshBlobServiceClient = {
        getContainerClient: jest.fn().mockReturnValue(freshContainer)
      }
      BlobServiceClient.fromConnectionString.mockReturnValueOnce(freshBlobServiceClient)

      const result = await storage.getFile('file.csv', true)

      expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(config.connectionStr)
      expect(freshContainer.getBlockBlobClient).toHaveBeenCalledWith('outbound/file.csv')
      expect(result.blob).toBe(freshBlob)
    })
  })

  describe('initialiseContainers', () => {
    test('creates container when createContainers is enabled', async () => {
      config.createContainers = true
      jest.resetModules()
      storage = require('../../app/storage')

      await storage.getFile('file.csv')

      expect(mockContainer.createIfNotExists).toHaveBeenCalledTimes(1)
    })
  })

  describe('writeFile', () => {
    test('writes AP file to AP folder', async () => {
      const { AP } = require('../../app/ledgers')

      await storage.writeFile('file.csv', AP, 'content')

      expect(mockShareServiceClient.getShareClient).toHaveBeenCalledWith(config.shareName)
      expect(mockShare.getDirectoryClient).toHaveBeenCalledWith(config.apFolder)
      expect(mockFolder.getFileClient).toHaveBeenCalledWith('file.csv')
      expect(mockFile.create).toHaveBeenCalledWith(7)
      expect(mockFile.uploadRange).toHaveBeenCalledWith('content', 0, 7)
    })

    test('writes AR file to AR folder', async () => {
      const { AR } = require('../../app/ledgers')

      await storage.writeFile('file.csv', AR, 'content')

      expect(mockShare.getDirectoryClient).toHaveBeenCalledWith(config.arFolder)
    })

    test('writes DPS file to DPS folder', async () => {
      const { DPS } = require('../../app/ledgers')

      await storage.writeFile('file.csv', DPS, 'content')

      expect(mockShare.getDirectoryClient).toHaveBeenCalledWith(config.dpsFolder)
    })
  })

  describe('archiveFile', () => {
    test('copies blob to archive and deletes original on success', async () => {
      const archiveBlob = {
        beginCopyFromURL: jest.fn().mockResolvedValue({
          pollUntilDone: jest.fn().mockResolvedValue({ copyStatus: 'success' })
        }),
        upload: jest.fn().mockResolvedValue()
      }
      mockContainer.getBlockBlobClient.mockImplementation((path) => {
        return path === `${config.archiveFolder}/file.csv` ? archiveBlob : mockBlob
      })

      await storage.archiveFile('file.csv', mockBlob)

      expect(mockContainer.getBlockBlobClient).toHaveBeenCalledWith('archive/file.csv')
      expect(archiveBlob.beginCopyFromURL).toHaveBeenCalledWith(mockBlob.url)
      expect(mockBlob.delete).toHaveBeenCalledTimes(1)
    })

    test('does not delete original when copy fails', async () => {
      const archiveBlob = {
        beginCopyFromURL: jest.fn().mockResolvedValue({
          pollUntilDone: jest.fn().mockResolvedValue({ copyStatus: 'pending' })
        }),
        upload: jest.fn().mockResolvedValue()
      }
      mockContainer.getBlockBlobClient.mockImplementation((path) => {
        return path === `${config.archiveFolder}/file.csv` ? archiveBlob : mockBlob
      })

      await storage.archiveFile('file.csv', mockBlob)

      expect(mockBlob.delete).not.toHaveBeenCalled()
    })
  })
})
