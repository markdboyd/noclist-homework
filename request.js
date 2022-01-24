const crypto = require('crypto');
const http = require('http');

async function makeRequest(requestParams) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      requestParams,
      response => {
        if (response.statusCode !== 200) {
          return reject(`request to ${requestParams.path} failed: unexpected statusCode ${response.statusCode}`);
        }
        let body = '';
        response.on('data', (data) => body += data);
        response.on('end', () => resolve({
          headers: response.headers,
          body
        }));
      }
    );
    req.on('error', (error) => reject(error));
    req.end();
  });
}

async function makeRequestWithRetries(requestParams, allowedRetries = 3) {
  let currentRetry = 1;
  let response;
  while (!response && currentRetry <= allowedRetries) {
    try {
      return await makeRequest(requestParams);
    } catch (error) {
      if (currentRetry < allowedRetries) {
        console.error(`error: ${error}, retrying`);
      } else {
        throw new Error(error);
      }
    }
    currentRetry += 1;
  }
}

async function getAuthToken(requestParams) {
  const { headers } = await makeRequestWithRetries(requestParams);
  return headers['badsec-authentication-token'];
}

async function getUserIds(requestParams, authToken) {
  requestParams.headers = requestParams.headers || {};
  requestParams.headers['X-Request-Checksum'] = crypto.createHash('sha256').update(`${authToken}/users`).digest('hex');
  const { body } = await makeRequestWithRetries(requestParams);
  return body.split('\n');
}

module.exports = {
  makeRequestWithRetries,
  getAuthToken,
  getUserIds,
};
