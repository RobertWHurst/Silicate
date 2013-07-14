var app = require('express')();

app.get('/', function(req, res) {
  res.end('hello!');
});

app.listen(80);
