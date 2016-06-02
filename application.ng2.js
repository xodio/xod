const Server = require('./server/server');
const ServerConfig = require('./server/config/config');

const mode = require('get-env')({
  test: ['test', 'testing'],
  production: ['prod', 'production'],
  development: ['dev', 'development']
});

const config = new ServerConfig(mode);

const server = new Server(config.resolve());

server.launch();

/*

server.engine('jade', expressJade({}));
server.set('view engine', 'jade');

server.use(express.static('static'));
server.use('/examples', express.static('examples'));
server.use('/nodes', express.static('nodes'));
server.use('/web', express.static('build/web'));

server.get('/', function(request, rssponse) {
  rssponse.redirect('/toggle-button/');
});

server.get('/:example/', function(request, response) {
  response.render('index', {example: request.params.example});
});

server.listen(1705, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('xod is listening at http://%s:%s', host, port);
});
*/
