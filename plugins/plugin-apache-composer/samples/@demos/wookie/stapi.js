var request = require('request')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main(params) {
  // return {status: "stapi got", stapiResult: params}

  var search = params.params.search

  var url = 'http://stapi.co/api/v1/rest/character/search'

  var promise = new Promise(function(resolve) {
    // eslint-disable-next-line handle-callback-err
    request.post(url, { form: { name: search, title: search } }, function(
      error,
      response,
      body
    ) {
      resolve({
        // need to return this so that HTTP Response body is parsed correctly
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.parse(body)
      })
    })
  })
  return promise
}
