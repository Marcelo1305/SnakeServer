const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const socket = new WebSocket("ws://localhost:3000/");

//Recebe os dados do servidor
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
        //ctx.fillStyle = "red";
        //alert(data.foods);
        data.foods.forEach(food => {
            ctx.fillStyle = food.color;
            ctx.fillRect(food.x * 20, food.y * 20, 20, 20);
        });
    }

    var divPontos = document.getElementById("divPontos");
    divPontos.innerHTML = ""; //limpa a div 

    // Draw snakes
    data.snakes.forEach((snake) => {
        //Verifica se as informações estão corretas
        if (!snake || !Array.isArray(snake)) {
            console.error("Invalid snake data:", snake);
            return;
        }

        //preenche os labels com os jogadores e seus pontos
        var novoLabel = document.createElement("label");
        novoLabel.style.color = snake[0].color;
        novoLabel.textContent = "Pontos: " + snake.length;
        divPontos.appendChild(novoLabel);

        //Desenha as Snakes
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

//Envia a direção para o servidor
function sendDirection(dir) {
    socket.send(JSON.stringify({ direction: dir }));
}

// Eventos de clicks
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
