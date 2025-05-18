const http = require('http');
const createServer = require('../index');

async function request(path) {
  const server = createServer();
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  return new Promise((resolve, reject) => {
    http.get({ port, path }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        server.close(() => resolve({ status: res.statusCode, data }));
      });
    }).on('error', err => {
      server.close(() => reject(err));
    });
  });
}

(async () => {
  const res = await request('/health');
  if (res.status !== 200) {
    console.error('Expected status 200, got', res.status);
    process.exit(1);
  }
  const body = JSON.parse(res.data);
  if (body.status !== 'ok') {
    console.error('Unexpected body', body);
    process.exit(1);
  }
  console.log('Tests passed');
})();
