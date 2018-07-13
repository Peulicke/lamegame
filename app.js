var express = require('express');
var app = express();
var server = require('http').createServer(app);  
var io = require('socket.io').listen(server);

app.use(express.static(__dirname));

app.get('/', function(req, res){
    res.sendfile('/index.html', {root: __dirname});
});

server.listen(process.env.PORT || 4004, function(){
    console.log('listening');
});

io.on('connection', function(socket){
    players.push(new Player(socket, players.length));
});

var phase = "lobby"; // lobby => setup => (attack => reinforce)
var width = 10, height = 8, density = 0.5;
var level;
var players = [];

function Player(socket, index){
    this.socket = socket;
    this.index = index;
    this.color = null;
    this.i1 = null;
    this.j1 = null;
    this.i2 = null;
    this.j2 = null;
    
    var t = this;
    socket.on("color", function(color){
        if(phase != "lobby") return;
        t.color = color;
        checkEveryoneReady();
    });
    socket.on("select", function(pos){
        if(phase != "setup") return;
        t.i1 = pos.i;
        t.j1 = pos.j;
        checkEveryoneSetup();
    });
    socket.on('disconnect', function(){
        players.splice(t.index, 1);
        if(players.length == 0) reset();
    });
}

function reset(){
    phase = "lobby";
}

function checkEveryoneReady(){
    console.log("Is everyone ready?");
    for(var i in players){
        if(players[i].color == null){
            console.log("No");
            return;
        }
    }
    console.log("Yes");
    console.log("Number of players: " + players.length);
    phase = "setup";
    level = [];
    for(var i = 0; i < height; ++i){
        level.push([]);
        for(var j = 0; j < height; ++j){
            level[i].push(null);
        }
    }
    var i = Math.floor(Math.random()*height);
    var j = Math.floor(Math.random()*width);
    var land = 0;
    console.log("Generating level");
    while(land < density*width*height){
        console.log(i + ", " + j);
        if(level[i][j] == null) ++land;
        level[i][j] = {
            "playerIndex": null,
            "n": 0,
            "i": i,
            "j": j,
            "x": (j+i/2)*2+1,
            "y": (i*Math.sqrt(3)/2)*2+Math.sqrt(1.25)
        };
        switch(Math.floor(Math.random()*6)){
            case 0: --i; break;
            case 1: ++i; break;
            case 2: --j; break;
            case 3: ++j; break;
            case 4: --i; ++j; break;
            case 5: ++i; --j; break;
        }
        i = Math.max(i, 0);
        i = Math.min(i, height-1);
        j = Math.max(j, 0);
        j = Math.min(j, width-1);
    }
    sendState();
}

function checkEveryoneSetup(){
    console.log("Is everyone setup?");
    for(var i in players){
        if(players[i].i1 == null || players[i].j1 == null){
            console.log("No");
            return;
        }
    }
    console.log("Yes");
    console.log("Number of players: " + players.length);
    for(var i in players){
        level[players[i].i1][players[i].j1].playerIndex = i;
        ++level[players[i].i1][players[i].j1].n;
    }
    sendState();
}

function sendState(){
    var playerData;
    for(var i = 0; i < players.length; ++i){
        playerData.push({
            "color": players[i].color
        });
    }
    for(var i = 0; i < players.length; ++i){
        var data = {
            "index": i,
            "players": playerData,
            "level": level
        };
        players[i].socket.emit("state", data);
    }
}

function getPlayerInformation(){
    var result = [];
    for(var i = 0; i < players.length; ++i){
        result.push({
            "color": players[i].color
        });
    }
    return result;
}
