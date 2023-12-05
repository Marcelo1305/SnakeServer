const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const ip = 'dull-jade-calf-wear.cyclic.app';
const socket = new WebSocket("ws://"+ ip +":3000");

socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.gameOver) {
        alert('Voçê perdeu!');
        return;
    }
    // Função de comparação para ordenar do maior para o menor com base no tamanho
    const compararPorTamanho = (a, b) => b.length - a.length;

    // Usar a função de comparação no método sort
    data.snakes = data.snakes.sort(compararPorTamanho);
    draw(data);
});

function draw(data) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!data || !data.foods || !data.snakes) {
        return;
    }

    // Draw food
    if (data.foods[0].x !== undefined && data.foods[0].y !== undefined) {
        ctx.fillStyle = "red";
        ctx.fillRect(data.foods[0].x * 20, data.foods[0].y * 20, 20, 20);
    }

    // Draw snakes
    ctx.fillStyle = "green";
    var divPontos = document.getElementById("divPontos");
    divPontos.innerHTML = ""; //limpa a div 


    data.snakes.forEach((snake) => {
        if (!snake || !Array.isArray(snake)) {
            console.error("Invalid snake data:", snake);
            return;
        }
        var novoLabel = document.createElement("label");
        novoLabel.style.color = snake[0].color;
        novoLabel.textContent = "Pontos: " + snake.length;
        divPontos.appendChild(novoLabel);
        snake.forEach((segment) => {
            if (segment && segment.x !== undefined && segment.y !== undefined) {
                ctx.lineWidth = 2;
                ctx.fillStyle = segment.color;
                ctx.fillRect(segment.x * 20, segment.y * 20, 20, 20);
                ctx.strokeStyle = "black";
                ctx.strokeRect(segment.x * 20, segment.y * 20, 20, 20);
            } else {
                console.error("Invalid snake segment:", segment);
            }
        });
    });
}
function sendDirection(dir) {
    socket.send(JSON.stringify({ direction: dir }));
}

document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
            sendDirection("UP");
            break;
        case "ArrowDown":
            sendDirection("DOWN");
            break;
        case "ArrowLeft":
            sendDirection("LEFT");
            break;
        case "ArrowRight":
            sendDirection("RIGHT");
            break;
    }
});

// Adicione uma função para enviar a cor escolhida para o servidor
function chooseSnakeColor(color) {
    socket.send(JSON.stringify({ chooseColor: color }));
}

// Adicione um evento para capturar a escolha de cor do usuário (isso pode variar dependendo da sua implementação da interface)
const colorPicker = document.getElementById("colorPicker");
colorPicker.addEventListener("change", (event) => {
    const chosenColor = event.target.value;
    chooseSnakeColor(chosenColor);
});

// Note: No need to call draw() here; it will be triggered by WebSocket messages
