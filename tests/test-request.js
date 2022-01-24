const nock = require('nock');
const test = require('ava');

const {
  makeRequestWithRetries,
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

test.serial('makeRequestWithRetries() retries failing request and throws error after allowed number of attempts', async (t) => {
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
