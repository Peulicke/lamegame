var app = require('express')();
var server = require('http').createServer(app);  
var io = require('socket.io').listen(server);

app.get('/', function(req, res){
    res.sendfile('/index.html', { root:__dirname });
});

server.listen(process.env.PORT || 4004, function(){
    console.log('listening');
});

io.on('connection', function(socket){
    socket.on('clientEvent', function(data){
        io.sockets.emit("test", "Ny bruger: " + (new Date()).toLocaleString());
    });
    socket.on('disconnect', function(){
        io.sockets.emit("test", "Bruger logget af: " + (new Date()).toLocaleString());
    });
});
