var socket = io.connect();

socket.on("connect", function(){
    createLobby();
});

function createLobby(){
    var colorInput = document.createElement("input");
    colorInput.type = "color";
    document.body.appendChild(colorInput);
    var btn = document.createElement("button");
    btn.innerHTML = "Ready";
    btn.onclick = function(){
        console.log(colorInput.value);
        socket.emit("color", colorInput.value);
    }
    document.body.appendChild(btn);
}
