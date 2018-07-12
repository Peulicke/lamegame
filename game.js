var canvas;
var ctx;
var scale = 40;
var players = [];
var index = 0;
var level = null;

setInterval(draw);
function draw(){
    if(level == null) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
});

document.addEventListener('keydown', function(event){
    console.log(event.key);
});
