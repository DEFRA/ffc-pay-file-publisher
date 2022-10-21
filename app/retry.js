const { totalRetries } = require('./config')

const retry = async (fn, retriesLeft = totalRetries, interval = 1000, exponential = true) => {
  try {
    return (await fn())
  } catch (err) {
    if (retriesLeft > 0) {
      await new Promise(resolve => setTimeout(resolve, interval))
      return retry(fn, retriesLeft - 1, exponential ? interval * 2 : interval, exponential)
    } else {
      throw err
    }
  }
}

module.exports = retry
