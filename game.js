var canvas;
var ctx;
var scale;
var players = [];
var index = 0;
var level = null;

setInterval(draw);
function draw(){
    if(level == null) return;
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
        ctx.fillRect(canvas.width-width,i*(height+space),width,height);
    }
}

function drawLevel(){
    for(var i = 0; i < level.length; ++i){
        for(var j = 0; j < level[i].length; ++j){
            if(level[i][j] == null) continue;
            drawHexagon(level[i][j].x*scale, level[i][j].y*scale, scale, level[i][j].player != null ? level[i][j].player.color : null);
        }
    }
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

socket.on("setup", function(data){
    console.log("Received setup data: ");
    console.log(data);
    index = data.index;
    level = data.level;
    players = data.players;
    
    document.body.innerHTML = "";
    canvas = document.createElement("canvas");
    canvas.width = innerWidth*0.99;
    canvas.height = innerHeight*0.99;
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    
    scale = canvas.width/((level[0].length+(level.length-1)/2)*2);
});

document.addEventListener('keydown', function(event){
    console.log(event.key);
});
