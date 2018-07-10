var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io');

io.listen(http);

app.get('/', function(req, res) {
   res.sendfile('/index.html', { root:__dirname });
});

io.on('connection', function(socket) {
   socket.on('clientEvent', function(data) {
      console.log(data);
   });
});

http.listen(process.env.PORT || 4004, function() {
   console.log('listening');
});
