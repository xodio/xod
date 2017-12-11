const path = require('path');
const http = require('http');
const util = require('util');
const nodeStatic = require('node-static');

const PORT = process.env.STATIC_SERVER_PORT || 8081;
const pathToDist = path.resolve(__dirname, '../dist');

const file = new nodeStatic.Server(pathToDist);
const server = http.createServer((request, response) => {
  request.addListener('end', () => {
    file.serve(request, response);
  }).resume();
});

const startServer = util.promisify(server.listen.bind(server, PORT));
const stopServer = util.promisify(server.close.bind(server));

module.exports = {
  PORT,
  startServer,
  stopServer,
};
