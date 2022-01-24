const crypto = require('crypto');

const {
  makeRequestWithRetries,
} = require('./request');

async function getAuthToken(requestParams) {
  const { headers } = await makeRequestWithRetries(requestParams);
  return headers['Badsec-Authentication-Token'.toLowerCase()];
}

async function getUsers(requestParams, authToken) {
  requestParams.headers = requestParams.headers || {};
  requestParams.headers['X-Request-Checksum'] = crypto.createHash('sha256').update(`${authToken}/users`).digest('hex');
  const { body } = await makeRequestWithRetries(requestParams);
  return body.split('\n');
}

async function runProgram() {
  const authToken = await getAuthToken({
    hostname: '0.0.0.0',
    port: 8888,
    path: '/auth'
  });
  const users = await getUsers({
    hostname: '0.0.0.0',
    port: 8888,
    path: '/users',
  }, authToken);
  console.log(users);
}

runProgram()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

module.exports = {
  makeRequestWithRetries,
};
