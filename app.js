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
    this.endTurn = false;
    
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
        t.endTurn = true;
        checkEveryoneSetup();
    });
    socket.on("attack", function(pos){
        if(phase != "attack") return;
        t.i1 = pos.i1;
        t.j1 = pos.j1;
        t.i2 = pos.i2;
        t.j2 = pos.j2;
        t.endTurn = true;
        checkEveryoneAttack();
    });
    socket.on("reinforce", function(pos){
        if(phase != "reinforce") return;
        t.reinforce = pos;
        t.endTurn = true;
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
        if(!players[i].endTurn){
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
        if(!players[i].endTurn){
            console.log("No");
            return;
        }
    }
    console.log("Yes");
    // Troops leave
    for(var i in players){
        if(players[i].i1 == null || players[i].j1 == null || players[i].i2 == null || players[i].j2 == null){
            players[i].attack = null;
            continue;
        }
        players[i].attack = level[players[i].i1][players[i].j1].n-1;
        level[players[i].i1][players[i].j1].n = 1;
    }
    // Troops meet at borders
    for(var i = 0; i < players.length; ++i){
        if(players[i].attack == null) continue;
        for(var j = i+1; j < players.length; ++j){
            if(players[j].attack == null) continue;
            if(players[i].i1 != players[j].i2 || players[i].j1 != players[j].j2 || players[i].i2 != players[j].i1 || players[i].j2 != players[j].j1) continue;
            if(players[i].attack == players[j].attack){
                players[i].attack = players[j].attack = null;
                break;
            }
            if(players[i].attack < players[j].attack){
                players[j].attack -= deadAfterFight(players[i].attack, players[j].attack);
                players[i].attack = null;
                break;
            }
            players[i].attack -= deadAfterFight(players[i].attack, players[j].attack);
            players[j].attack = null;
            break;
        }
    }
    // Troops meet at territories
    for(var i = 0; i < height; ++i){
        for(var j = 0; j < width; ++j){
            if(level[i][j] == null) continue;
            var attackers = [];
            var sum = 0;
            for(var p in players){
                if(players[p].attack != null && players[p].i2 == i && players[p].j2 == j){
                    attackers.push(players[p]);
                    sum += players[p].attack;
                }
            }
            if(level[i][j].n == sum){
                level[i][j].playerIndex = null;
                level[i][j].n = 0;
                for(var p in attackers){
                    attackers[p].attack = null;
                }
                continue;
            }
            if(level[i][j].n > sum){
                level[i][j].n -= deadAfterFight(level[i][j].n, sum);
                for(var p in attackers){
                    attackers[p].attack = null;
                }
                continue;
            }
            var maxAttacker = null;
            var multipleMax;
            for(var p = 0; p < attackers.length; ++p){
                var diff = (level[i][j].n*attackers[p].attack/sum)*(level[i][j].n*attackers[p].attack/sum)/attackers[p].attack;
                attackers[p].attack -= diff;
                sum -= diff;
                if(maxAttacker == null || attackers[p].attack > maxAttacker.attack){
                    maxAttacker = attackers[p];
                    multipleMax = false;
                    continue;
                }
                if(attackers[p].attack == maxAttacker.attack) multipleMax = true;
            }
            level[i][j].playerIndex = null;
            level[i][j].n = 0;
            if(multipleMax){
                for(var p in attackers){
                    attackers[p].attack = null;
                }
                continue;
            }
            sum -= maxAttacker.attack;
            var kills = 0;
            for(var p in attackers){
                if(attackers[p] == maxAttacker) continue;
                kills += attackers[p].attack*attackers[p].attack/maxAttacker.attack;
                attackers[p].attack = null;
            }
            maxAttacker.attack -= kills;
            maxAttacker.attack = Math.max(Math.floor(maxAttacker.attack), 0);
            if(maxAttacker.attack == 0){
                maxAttacker.attack = null;
                continue;
            }
            level[i][j].playerIndex = maxAttacker.index;
            level[i][j].n = maxAttacker.attack;
            maxAttacker.attack = null;
        }
    }
    for(var i in players){
        players[i].i1 = null;
        players[i].j1 = null;
        players[i].i2 = null;
        players[i].j2 = null;
        players[i].attack = null;
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
        if(!players[i].endTurn){
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
        players[i].endTurn = false;
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
