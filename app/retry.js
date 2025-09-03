const { totalRetries, retryInterval } = require('./config/publish')

const retry = async (fn, ...args) => {
  // Last argumnent is retry options object
  const options = args.length && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1])
    ? args[args.length - 1]
    : {}

  const callArgs = options === args[args.length - 1] ? args.slice(0, -1) : args

  const {
    retriesLeft = totalRetries,
    interval = retryInterval,
    exponential = true
  } = options

  const isSecondToLast = retriesLeft === 1

  try {
    return await fn(...callArgs, isSecondToLast)
  } catch (err) {
    if (retriesLeft > 0) {
      await new Promise(resolve => setTimeout(resolve, interval))
      const nextOptions = {
        retriesLeft: retriesLeft - 1,
        interval: exponential ? interval * 2 : interval,
        exponential
      }
      return retry(fn, ...callArgs, nextOptions)
    } else {
      throw err
    }
  }
}

module.exports = retry
