const rp = require('request-promise')
const retries = process.env.RETRIES || 3
const delay = process.env.RETRY_DELAY || 1000
const timeout = process.env.TIMEOUT || 1000

class ValidationError extends Error {
  constructor (message) {
    super(message)
    this.name = 'ValidationError'
    this.message = message
  }

  toJSON () {
    return {
      error: {
        name: this.name,
        message: this.message,
        stacktrace: this.stack
      }
    }
  }
}

const requestRetry = (options, retries) => {
  return new Promise((resolve, reject) => {
    const retry = (options, n) => {
      return rp(options)
        .then(response => {
          if (response.body.error) {
            if (n === 1) {
              reject(response.body)
            } else {
              setTimeout(() => {
                retries--
                retry(options, retries)
              }, delay)
            }
          } else {
            return resolve(response)
          }
        })
        .catch(error => {
          if (n === 1) {
            reject(error.message)
          } else {
            setTimeout(() => {
              retries--
              retry(options, retries)
            }, delay)
          }
        })
    }
    return retry(options, retries)
  })
}

const validateInput = (input) => {
  return new Promise((resolve, reject) => {
    const validated = {}
    if (typeof input.id === 'undefined') {
      input.id = '1'
    }
    validated.id = input.id

    if (typeof input.data === 'undefined') {
      reject(new ValidationError('No data supplied'))
    }
    validated.data = {}

    const base = input.data.base || input.data.from || input.data.coin
    if (typeof base === 'undefined') {
      reject(new ValidationError('Base parameter required'))
    }
    validated.data.base = base

    const quote = input.data.quote || input.data.to || input.data.market
    if (typeof quote === 'undefined') {
      reject(new ValidationError('Quote parameter required'))
    }
    validated.data.quote = quote

    resolve(validated)
  })
}

const createRequest = (input, callback) => {
  validateInput(input)
    .then(validated => {
      const jobRunID = validated.id
      const coin = validated.data.base
      const market = validated.data.quote
      const url = `https://rest.coinapi.io/v1/exchangerate/${coin}/${market}`
      const options = {
        url: url,
        qs: {
          apikey: process.env.API_KEY
        },
        json: true,
        timeout,
        resolveWithFullResponse: true
      }
      requestRetry(options, retries)
        .then(response => {
          const result = response.body.rate
          if (Number(result) === 0) throw new ValidationError('Zero result')
          response.body.result = result
          callback(response.statusCode, {
            jobRunID,
            data: response.body,
            result,
            statusCode: response.statusCode
          })
        })
        .catch(error => {
          callback(500, {
            jobRunID,
            status: 'errored',
            error,
            statusCode: 500
          })
        })
    })
    .catch(error => {
      callback(500, {
        jobRunID: input.id,
        status: 'errored',
        error: error.message,
        statusCode: 500
      })
    })
}

exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}

module.exports.createRequest = createRequest
