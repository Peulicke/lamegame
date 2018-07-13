var canvas;
var ctx;
var scale;
var players = [];
var index = null;
var level = null;
var mouseX = 0;
var mouseY = 0;
var selected;
var phase = "lobby";
var setupLeft = 0;
var attack = null;
var reinforce = null;
var reinforcement = 0;

setInterval(draw);

function draw(){
    if(!ctx) return;
    calculateClosest();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLevel();
    drawPlayers();
    if(setupLeft > 0) drawSetupLeft();
    drawPhase();
}

function drawSetupLeft(){
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText("Pieces left: " + setupLeft, 0, 0.9*canvas.height);
}

function drawPhase(){
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText("Phase: " + phase + ((phase == "reinforce") ? ", reinforcement: " + reinforcement : ""), 0, 0.95*canvas.height);
}

function drawPlayers(){
    var width = 100;
    var height = 30;
    var space = 20;
    for(var i = 0; i < players.length; ++i){
        ctx.fillStyle = players[i].color;
        ctx.fillRect(canvas.width-width-space,space+i*(height+space),width,height);
        if(i != index) continue;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.strokeRect(canvas.width-width-space,space+i*(height+space),width,height);
    }
}

function drawLevel(){
    if(level == null) return;
    for(var i = 0; i < level.length; ++i){
        for(var j = 0; j < level[i].length; ++j){
            if(level[i][j] == null) continue;
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            drawHexagon(level[i][j].x*scale, level[i][j].y*scale, scale, level[i][j].playerIndex != null ? players[level[i][j].playerIndex].color : null);
            if(level[i][j].n == 0) continue;
            var text = level[i][j].n;
            if(phase == "reinforce" && level[i][j].playerIndex == index && reinforce[i][j] > 0){
                text += " + " + reinforce[i][j];
            }
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.fillText(text, level[i][j].x*scale, level[i][j].y*scale);
        }
    }
    ctx.strokeStyle = "black";
    ctx.lineWidth = 10;
    drawHexagon(selected.x*scale, selected.y*scale, scale, null);
    if(attack.i1 != null && attack.j1 != null){
        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        drawHexagon(level[attack.i1][attack.j1].x*scale, level[attack.i1][attack.j1].y*scale, scale, null);
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 3;
        drawHexagon(level[attack.i1][attack.j1].x*scale, level[attack.i1][attack.j1].y*scale, scale, null);
        if(attack.i2 != null && attack.j2 != null){
            ctx.strokeStyle = "black";
            ctx.lineWidth = 5;
            drawHexagon(level[attack.i2][attack.j2].x*scale, level[attack.i2][attack.j2].y*scale, scale, null);
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 3;
            drawHexagon(level[attack.i2][attack.j2].x*scale, level[attack.i2][attack.j2].y*scale, scale, null);
        }
    }
}

function calculateClosest(){
    var minDistSqr = 100000000;
    var iMin, jMin;
    for(var i = 0; i < level.length; ++i){
        for(var j = 0; j < level[i].length; ++j){
            if(level[i][j] == null) continue;
            if(phase == "setup" && level[i][j].playerIndex != null && level[i][j].playerIndex != index) continue;
            if(phase == "reinforce" && level[i][j].playerIndex != index) continue;
            var dx = level[i][j].x*scale-mouseX;
            var dy = level[i][j].y*scale-mouseY;
            var distSqr = dx*dx+dy*dy;
            if(distSqr < minDistSqr){
                minDistSqr = distSqr;
                iMin = i;
                jMin = j;
            }
        }
    }
    selected = level[iMin][jMin];
}

function drawHexagon(x, y, r, color){
    r *= Math.sqrt(1.25);
    if(color != null) ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y-r);
    ctx.lineTo(x-r*Math.sqrt(3)/2, y-r/2);
    ctx.lineTo(x-r*Math.sqrt(3)/2, y+r/2);
    ctx.lineTo(x, y+r);
    ctx.lineTo(x+r*Math.sqrt(3)/2, y+r/2);
    ctx.lineTo(x+r*Math.sqrt(3)/2, y-r/2);
    ctx.lineTo(x, y-r);
    ctx.closePath();
    color != null ? ctx.fill() : ctx.stroke();
}

socket.on("state", function(data){
    phase = data.phase;
    index = data.index;
    level = data.level;
    players = data.players;
    setupLeft = data.setupLeft;
    attack = {
        "i1": null,
        "j1": null,
        "i2": null,
        "j2": null
    };
    reinforce = [];
    for(var i = 0; i < level.length; ++i){
        reinforce.push([]);
        for(var j = 0; j < level[i].length; ++j){
            reinforce[i].push(0);
        }
    }
    reinforcement = Math.max(Math.floor(players[index].area/3), 3);
    
    document.body.innerHTML = "";
    canvas = document.createElement("canvas");
    canvas.width = innerWidth*0.9;
    canvas.height = innerHeight*0.9;
    document.body.appendChild(canvas);
    canvas.onmousemove = function(event){
        mouseX = event.clientX;
        mouseY = event.clientY;
    };
    canvas.onmousedown = function(event){
        switch(phase){
            case "setup":
                if(event.button == 0){
                    socket.emit("setup", {
                        "i": selected.i,
                        "j": selected.j
                    });
                }
                break;
            case "reinforce":
                if(event.button == 0 && reinforcement > 0){
                    ++reinforce[selected.i][selected.j];
                    --reinforcement;
                }
                if(event.button == 2 && reinforce[selected.i][selected.j] > 0){
                    --reinforce[selected.i][selected.j];
                    ++reinforcement;
                }
                break;
            case "attack":
                if(event.button == 0){
                    if(level[selected.i][selected.j].playerIndex != index || level[selected.i][selected.j].n <= 1){
                        attack.i1 = null;
                        attack.j1 = null;
                    }
                    else{
                        attack.i1 = selected.i;
                        attack.j1 = selected.j;
                    }
                    attack.i2 = null;
                    attack.j2 = null;
                }
                if(event.button == 2){
                    if(level[selected.i][selected.j].playerIndex == index) break;
                    if(Math.abs(selected.i-attack.i1) > 1 || Math.abs(selected.j-attack.j1) > 1 || Math.abs((selected.i+selected.j)-(attack.i1+attack.j1)) > 1) break;
                    attack.i2 = selected.i;
                    attack.j2 = selected.j;
                }
                break;
        }
    };
    ctx = canvas.getContext("2d");
    ctx.font = "30px Arial";
    
    scale = Math.min(canvas.width/((level[0].length+(level.length-1)/2)*2), canvas.height/((0.5+1.5*level.length)*Math.sqrt(1.25)))*0.95;
});

document.addEventListener('keydown', function(event){
    console.log(event.key);
    if(event.key != "Enter") return;
    switch(phase){
        case "attack":
            if(attack.i1 == null || attack.j1 == null || attack.i2 == null || attack.j2 == null) attack.i1 = attack.j1 = attack.i2 = attack.j2 = null;
            socket.emit("attack", attack);
            break;
        case "reinforce":
            if(reinforcement > 0) return;
            socket.emit("reinforce", reinforce);
            break;
    }
});
