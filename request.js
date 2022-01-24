const crypto = require('crypto');
const http = require('http');

/**
 * Make an HTTP(S) request.
 *
 * @param {Object} requestParams
 *   Request options passed to https://nodejs.org/api/http.html#httprequesturl-options-callback
 * @returns {Promise<Object>} - Object containing response headers and body
 */
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

/**
 * Make an HTTP(S) request with built-in retry logic on request failure.
 *
 * @param {Object} requestParams
 *   Request options passed to https://nodejs.org/api/http.html#httprequesturl-options-callback
 * @param {number} [allowedRetries] - Number of times to retry request before throwing an error
 * @returns {Promise<Object>} - Object containing response headers and body
 * @throws {Error}
 */
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

/**
 * Get auth token from server
 * @param {Object} requestParams
 *   Request options passed to https://nodejs.org/api/http.html#httprequesturl-options-callback
 * @returns {Promise<string>} - Auth token from server
 */
async function getAuthToken(requestParams) {
  requestParams.method = 'HEAD';
  const { headers } = await makeRequestWithRetries(requestParams);
  return headers['badsec-authentication-token'];
}

/**
 * Get user IDs from server
 * @param {Object} requestParams
 *   Request options passed to https://nodejs.org/api/http.html#httprequesturl-options-callback
 * @param {string} authToken - auth token to use for request
 * @returns {Promise<Array<string>>} - Array of user IDs
 */
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
