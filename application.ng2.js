import * as express from 'express';
import expressJade from 'express-jade';

const server = express();

server.engine('handlebars', expressJade({}));
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

  console.log('App listening at http://%s:%s', host, port);
});
