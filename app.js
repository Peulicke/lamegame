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
var setupLeft = 0;
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
    socket.on("setup", function(pos){
        if(phase != "setup") return;
        t.i1 = pos.i;
        t.j1 = pos.j;
        checkEveryoneSetup();
    });
    socket.on("attack", function(pos){
        if(phase != "attack") return;
        t.i1 = pos.i1;
        t.j1 = pos.j1;
        t.i2 = pos.i2;
        t.j2 = pos.j2;
        checkEveryoneAttack();
    });
    socket.on("reinforce", function(pos){
        if(phase != "reinforce") return;
        t.reinforce = pos;
        checkEveryoneReinforce();
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
    console.log("Number of players: " + players.length);
    console.log("Is everyone ready?");
    for(var i in players){
        if(players[i].color == null){
            console.log("No");
            return;
        }
    }
    console.log("Yes");
    phase = "setup";
    setupLeft = Math.round(0.5*(density*width*height/players.length));
    level = [];
    for(var i = 0; i < height; ++i){
        level.push([]);
        for(var j = 0; j < width; ++j){
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
    console.log("Number of players: " + players.length);
    console.log("Is everyone setup?");
    for(var i in players){
        if(players[i].i1 == null || players[i].j1 == null){
            console.log("No");
            return;
        }
    }
    console.log("Yes");
    for(var i in players){
        if(level[players[i].i1][players[i].j1].playerIndex == null || level[players[i].i1][players[i].j1].playerIndex == i){
            level[players[i].i1][players[i].j1].playerIndex = i;
            ++level[players[i].i1][players[i].j1].n;
            continue;
        }
        level[players[i].i1][players[i].j1].playerIndex = "multiple";
    }
    for(var i in players){
        if(level[players[i].i1][players[i].j1].playerIndex == "multiple"){
            level[players[i].i1][players[i].j1].playerIndex = null;
            level[players[i].i1][players[i].j1].n = 0;
        }
    }
    for(var i in players){
        players[i].i1 = null;
        players[i].j1 = null;
    }
    --setupLeft;
    if(setupLeft == 0) phase = "attack";
    sendState();
}

function checkEveryoneAttack(){
    console.log("Number of players: " + players.length);
    console.log("Has everyone attacked?");
    for(var i in players){
        if(players[i].i1 == null || players[i].j1 == null || players[i].i2 == null || players[i].j2 == null){
            console.log("No");
            return;
        }
    }
    console.log("Yes");
    for(var i in players){
        players[i].attack = level[players[i].i1][players[i].j1].n-1;
        level[players[i].i1][players[i].j1].n = 1;
    }
    for(var i in players){
        if(players[i].attack == level[players[i].i2][players[i].j2].n){
            level[players[i].i2][players[i].j2].playerIndex = null;
            level[players[i].i2][players[i].j2].n = 0;
            continue;
        }
        if(players[i].attack < level[players[i].i2][players[i].j2].n){
            level[players[i].i2][players[i].j2].n -= deadAfterFight(players[i].attack, level[players[i].i2][players[i].j2].n);
            continue;
        }
        level[players[i].i2][players[i].j2].playerIndex = i;
        level[players[i].i2][players[i].j2].n = players[i].attack-deadAfterFight(players[i].attack, level[players[i].i2][players[i].j2].n);
    }
    for(var i in players){
        players[i].i1 = null;
        players[i].j1 = null;
        players[i].i2 = null;
        players[i].j2 = null;
    }
    phase = "reinforce";
    sendState();
}

function deadAfterFight(a, b){
    if(a < b) return deadAfterFight(b, a);
    return Math.ceil(b*b/a);
}

function checkEveryoneReinforce(){
    console.log("Number of players: " + players.length);
    console.log("Has everyone reinforced?");
    for(var i in players){
        if(players[i].reinforce == null){
            console.log("No");
            return;
        }
    }
    console.log("Yes");
    // TODO
    for(var p in players){
        for(var i = 0; i < height; ++i){
            for(var j = 0; j < width; ++j){
                if(level[i][j] == null || level[i][j].playerIndex != p) continue;
                level[i][j].n += players[p].reinforce[i][j];
            }
        }
        players[p].reinforce = null;
    }
    phase = "attack";
    sendState();
}

function sendState(){
    var playerData = [];
    for(var i = 0; i < players.length; ++i){
        playerData.push({
            "color": players[i].color,
            "area": 0
        });
        players[i].area = 0;
    }
    for(var i = 0; i < height; ++i){
        for(var j = 0; j < width; ++j){
            if(level[i][j] == null || level[i][j].playerIndex == null) continue;
            ++players[level[i][j].playerIndex].area;
            ++playerData[level[i][j].playerIndex].area;
        }
    }
    for(var i = 0; i < players.length; ++i){
        var data = {
            "phase": phase,
            "index": i,
            "players": playerData,
            "level": level,
            "setupLeft": setupLeft
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
