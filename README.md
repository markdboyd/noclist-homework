# noclist-homework

## Prerequisites

- Node.js `v15.14.0`
- Docker

### Using `nvm` to install correct Node.js version

If you have [NVM](https://github.com/nvm-sh/nvm) installed, you can run this command from the root of the repository to install the correct version:

```shell
nvm install
```

Afterwards, ensure you are using version `v15.14.0` of Node.js in your current shell:

```shell
$ node -v
v15.14.0
```

### Install dependencies

Install the dependencies for the project:

```shell
npm install
```

## Solution

Run the fake server for the problem:

```shell
docker run --rm -p 8888:8888 adhocteam/noclist
```

To run the program and generate the homework solution:

```shell
node noclist.js
```

## Tests

To run the tests:

`npm test`
