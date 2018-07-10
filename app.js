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
    players.push(new Player(socket,players.length));
});

var level = {
    "width": 100,
    "height": 100
};

function Player(socket, index){
    this.socket = socket;
    this.index = index;
    this.x = Math.floor(Math.random()*level.width);
    this.y = Math.floor(Math.random()*level.height);
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    
    var t = this;
    socket.on("a", function(a){
        t.ax = a.x;
        t.ay = a.y;
    });
    socket.on('disconnect', function(){
        players.splice(t.index,1);
    });
}

var players = [];

function update(){
    for(var i in players){
        players[i].vx += players[i].ax;
        players[i].vy += players[i].ay;
        players[i].x += players[i].vx;
        players[i].y += players[i].vy;
    }
    io.sockets.emit("game", players);
}

setInterval(update,5000);
