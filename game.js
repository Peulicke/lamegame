var canvas;
var ctx;
var scale;
var players = [];
var index = 0;
var level = null;
var mouseX = 0;
var mouseY = 0;

setInterval(draw);
function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLevel();
    drawPlayers();
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
            drawHexagon(level[i][j].x*scale, level[i][j].y*scale, scale, level[i][j].player != null ? level[i][j].player.color : null);
        }
    }
    var minDistSqr = 100000000;
    var iMin, jMin;
    for(var i = 0; i < level.length; ++i){
        for(var j = 0; j < level[i].length; ++j){
            if(level[i][j] == null) continue;
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
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 10;
    drawHexagon(level[iMin][jMin].x*scale, level[iMin][jMin].y*scale, scale, null);
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
    ctx.lineWidth = 3;
    color != null ? ctx.fill() : ctx.stroke();
}

socket.on("state", function(data){
    index = data.index;
    level = data.level;
    players = data.players;
    
    document.body.innerHTML = "";
    canvas = document.createElement("canvas");
    canvas.width = innerWidth*0.9;
    canvas.height = innerHeight*0.9;
    document.body.appendChild(canvas);
    canvas.onmousemove = function(event){
        mouseX = event.clientX;
        mouseY = event.clientY;
    };
    ctx = canvas.getContext("2d");
    
    scale = canvas.width/((level[0].length+(level.length-1)/2)*2);
});

document.addEventListener('keydown', function(event){
    console.log(event.key);
});
