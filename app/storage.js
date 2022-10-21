const { BlobServiceClient } = require('@azure/storage-blob')
const { ShareServiceClient } = require('@azure/storage-file-share')
const { DefaultAzureCredential } = require('@azure/identity')
const config = require('./config/storage')
const { AR } = require('./ledgers')

let blobServiceClient
let containersInitialised
let container
let shareServiceClient
let share

const connect = () => {
  if (config.useConnectionStr) {
    console.log('Using connection string for BlobServiceClient')
    blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionStr)
  } else {
    console.log('Using DefaultAzureCredential for BlobServiceClient')
    const uri = `https://${config.storageAccount}.blob.core.windows.net`
    blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
  }

  container = blobServiceClient.getContainerClient(config.container)
  shareServiceClient = ShareServiceClient.fromConnectionString(config.shareConnectionString)
  share = shareServiceClient.getShareClient(config.shareName)
}

const initialiseContainers = async () => {
  if (config.createContainers) {
    console.log('Making sure blob containers exist')
    await container.createIfNotExists()
    console.log('Containers ready')
  }
  await initialiseFolders()
  containersInitialised = true
}

const initialiseFolders = async () => {
  console.log('Making sure folders exist')
  const placeHolderText = 'Placeholder'
  const outboundClient = container.getBlockBlobClient(`${config.outboundFolder}/default.txt`)
  const archiveClient = container.getBlockBlobClient(`${config.archiveFolder}/default.txt`)
  await outboundClient.upload(placeHolderText, placeHolderText.length)
  await archiveClient.upload(placeHolderText, placeHolderText.length)
  console.log('Folders ready')
}

const getBlob = async (folder, filename) => {
  containersInitialised ?? await initialiseContainers()
  return container.getBlockBlobClient(`${folder}/${filename}`)
}

const getFile = async (filename) => {
  console.log(`Searching for ${filename} in ${config.outboundFolder}`)
  const blob = await getBlob(config.outboundFolder, filename)
  const downloaded = await blob.downloadToBuffer()
  console.log(`Found ${filename}`)
  return { blob, content: downloaded.toString() }
}

const writeFile = async (filename, ledger, content) => {
  const folderName = getFolderName(ledger)
  const folder = share.getDirectoryClient(folderName)

  const file = folder.getFileClient(filename)
  await file.create(content.length)
  await file.uploadRange(content, 0, content.length)
}

const archiveFile = async (filename, blob) => {
  const destinationBlob = await getBlob(config.archiveFolder, filename)
  const copyResult = await (await destinationBlob.beginCopyFromURL(blob.url)).pollUntilDone()

  if (copyResult.copyStatus === 'success') {
    await blob.delete()
  }
}

const getFolderName = (ledger) => {
  return ledger === AR ? config.arFolder : config.apFolder
}

module.exports = {
  connect,
  getFile,
  writeFile,
  archiveFile
}
