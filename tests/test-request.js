const crypto = require('crypto');
const nock = require('nock');
const test = require('ava');

const {
  makeRequestWithRetries,
  getAuthToken,
  getUserIds,
} = require('../request');

test.before(() => {
  nock.disableNetConnect();
});

test.afterEach.always(() => {
  nock.cleanAll();
});

test.serial('makeRequestWithRetries() returns response from request with 200 status code', async (t) => {
  nock('http://fake-api.com')
    .get('/foo')
    .reply(200, 'bar');

  const { body } = await makeRequestWithRetries(
    {
      hostname: 'fake-api.com',
      path: '/foo',
    }
  );
  t.is(body, 'bar');
});

test.serial('makeRequestWithRetries() retries request with non-200 response and throws error after allowed number of attempts', async (t) => {
  const allowedRetries = 3;
  const scope = nock('http://fake-api.com')
    .get('/users')
    .times(allowedRetries)
    .reply(500);

  await t.throwsAsync(
    makeRequestWithRetries(
      {
        hostname: 'fake-api.com',
        path: '/users',
      },
      allowedRetries
    ),
    { message: /unexpected statusCode 500/ }
  );
  t.true(scope.isDone());
});

test.serial('makeRequestWithRetries() returns response from successful retry', async (t) => {
  const allowedRetries = 4;

  nock('http://fake-api.com')
    .get('/retrySuccess')
    .times(allowedRetries - 1)
    .reply(500);
  nock('http://fake-api.com')
    .get('/retrySuccess')
    .reply(200, 'success');

  const { body } = await makeRequestWithRetries(
    {
      hostname: 'fake-api.com',
      path: '/retrySuccess',
    },
    allowedRetries
  );
  t.is(body, 'success');
});

test.serial('getAuthToken() returns correct auth token', async (t) => {
  const authToken = 'baz';
  nock('http://fake-api.com')
    .get('/token')
    .reply(200, 'useless data', {
      'badsec-authentication-token': authToken,
    });
  const returnedToken = await getAuthToken({
    hostname: 'fake-api.com',
    path: '/token',
  });
  t.is(returnedToken, authToken);
});

test.serial('getUserIds() returns expected user ids', async (t) => {
  const authToken = 'token';
  const expectedRequestChecksum = crypto.createHash('sha256').update(`${authToken}/users`).digest('hex');

  nock('http://fake-api.com')
    .matchHeader('X-Request-Checksum', expectedRequestChecksum)
    .get('/users')
    .reply(200, '1\n2');

  const userIds = await getUserIds(
    {
      hostname: 'fake-api.com',
      path: '/users'
    },
    authToken
  );
  t.deepEqual(userIds, ['1','2']);
})
