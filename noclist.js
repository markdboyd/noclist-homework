const {
  makeRequestWithRetries,
  getAuthToken,
  getUserIds,
} = require('./request');

async function runProgram() {
  const authToken = await getAuthToken({
    hostname: '0.0.0.0',
    port: 8888,
    path: '/auth',
  });
  const users = await getUserIds(
    {
      hostname: '0.0.0.0',
      port: 8888,
      path: '/users',
    },
    authToken
  );
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
