const { sendMessage } = require('../../../../app/messaging/service-bus/send-message')

describe('sendMessage', () => {
  let sender

  beforeEach(() => {
    jest.clearAllMocks()
    sender = {
      sendMessages: jest.fn().mockResolvedValue()
    }
  })

  test('validates message, enriches it and sends it', async () => {
    const message = {
      body: { claimId: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service'
    }

    await sendMessage(sender, message)

    expect(sender.sendMessages).toHaveBeenCalledWith({
      body: { claimId: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service',
      applicationProperties: {
        type: 'uk.gov.demo.claim.validated',
        source: 'ffc-demo-claim-service'
      }
    }, undefined)
  })

  test('passes send options through', async () => {
    const message = {
      body: { claimId: 1 },
      type: 'uk.gov.demo.claim.validated',
      source: 'ffc-demo-claim-service'
    }
    const options = { transactionId: 'abc' }

    await sendMessage(sender, message, options)

    expect(sender.sendMessages).toHaveBeenCalledWith(expect.any(Object), options)
  })

  test('throws if validation fails', async () => {
    const message = { body: { claimId: 1 } }

    await expect(sendMessage(sender, message)).rejects.toThrow()
    expect(sender.sendMessages).not.toHaveBeenCalled()
  })
})
