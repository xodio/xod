
var express = require('express');
var exphbs  = require('express-handlebars');

var app = express();

app.engine('handlebars', exphbs({}));
app.set('view engine', 'handlebars');

app.use(express.static('static'));

app.get('/', function (req, res) {
  res.render('index');
});

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
