var app = require('express')();
var server = require('http').createServer(app);  
var io = require('socket.io').listen(server);

app.get('/', function(req, res) {
   res.sendfile('/index.html', { root:__dirname });
});

io.on('connection', function(socket) {
   socket.on('clientEvent', function(data) {
      console.log(data);
   });
});

server.listen(process.env.PORT || 4004, function() {
   console.log('listening');
});
