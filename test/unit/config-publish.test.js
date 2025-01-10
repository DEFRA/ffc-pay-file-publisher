describe('Publish Config Validation', () => {
  test('should throw error when config is invalid', () => {
    // Set environment variables to non-boolean values
    process.env.TOTAL_RETRIES = 'not a boolean'
    process.env.RETRY_INTERVAL = 'not a boolean'
    process.env.USE_EVENTS = 'not a boolean'
    process.env.FILE_PUBLISH_ENABLED = 'not a boolean'

    // Expect an error to be thrown during validation
    expect(() => {
      require('../../app/config/publish')
    }).toThrowError(/The publishing config is invalid./)
  })
})
