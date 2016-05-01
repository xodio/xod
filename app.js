
var express = require('express');
var exphbs  = require('express-handlebars');

var app = express();

app.engine('handlebars', exphbs({}));
app.set('view engine', 'handlebars');

app.use(express.static('static'));
app.use('/examples', express.static('examples'));
app.use('/nodes', express.static('nodes'));
app.use('/bower_components', express.static('bower_components'));

app.get('/', function (req, res) {
  res.redirect('/toggle-button/');
});

app.get('/:example/', function (req, res) {
  res.render('index', {example: req.params.example});
});

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
