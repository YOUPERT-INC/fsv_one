var app = require('./app');
var port = process.env.PORT || 3001;

var server = app.listen(port, function() {
  	server.keepAliveTimeout = 60000 * 2;
  	console.log(`Server Listening on Port : ${port}`);
});
