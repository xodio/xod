import restify from 'restify';

const server = restify.createServer({
  name: 'xod-cloud',
});

function send(req, res, next) {
  res.send(`hello ${req.params.name}`);
  return next();
}

server.get('/hello/:name', send);

server.listen(8000, 'localhost', () => {
  console.log('Server has been started!');
});
