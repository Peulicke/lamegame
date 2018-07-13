var canvas;
var ctx;
var scale;
var players = [];
var index = null;
var level = null;
var mouseX = 0;
var mouseY = 0;
var selected;
var setupLeft = 0;

setInterval(draw);

function draw(){
    if(!ctx) return;
    calculateClosest();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLevel();
    drawPlayers();
    if(setupLeft > 0) drawSetupLeft();
}

function drawSetupLeft(){
    ctx.fillStyle = "black";
    ctx.fillText("Pieces left: " + setupLeft, 0, 0.9*canvas.height);
}

function drawPlayers(){
    var width = 100;
    var height = 30;
    var space = 20;
    for(var i = 0; i < players.length; ++i){
        ctx.fillStyle = players[i].color;
        ctx.fillRect(canvas.width-width,space+i*(height+space),width,height);
    }
}

function drawLevel(){
    if(level == null) return;
    for(var i = 0; i < level.length; ++i){
        for(var j = 0; j < level[i].length; ++j){
            if(level[i][j] == null) continue;
            drawHexagon(level[i][j].x*scale, level[i][j].y*scale, scale, level[i][j].playerIndex != null ? players[level[i][j].playerIndex].color : null);
            ctx.fillStyle = "black";
            ctx.fillText(level[i][j].n, level[i][j].x*scale, level[i][j].y*scale);
        }
    }
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 10;
    drawHexagon(selected.x*scale, selected.y*scale, scale, null);
    ctx.lineWidth = 1;
}

function calculateClosest(){
    var minDistSqr = 100000000;
    var iMin, jMin;
    for(var i = 0; i < level.length; ++i){
        for(var j = 0; j < level[i].length; ++j){
            if(level[i][j] == null) continue;
            if(level[i][j].playerIndex != null && level[i][j].playerIndex != index) continue;
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
    ctx.strokeStyle = "black";
    color != null ? ctx.fill() : ctx.stroke();
}

socket.on("state", function(data){
    index = data.index;
    level = data.level;
    players = data.players;
    setupLeft = data.setupLeft;
    
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
        if(event.button == 0){
            socket.emit("select1", {
                "i": selected.i,
                "j": selected.j
            });
        }
        if(event.button == 2){
            socket.emit("select2", {
                "i": selected.i,
                "j": selected.j
            });
        }
    };
    ctx = canvas.getContext("2d");
    ctx.font = "30px Arial";
    
    scale = Math.min(canvas.width/((level[0].length+(level.length-1)/2)*2), canvas.height/((0.5+1.5*level.length)*Math.sqrt(1.25)))*0.95;
});

document.addEventListener('keydown', function(event){
    console.log(event.key);
});
