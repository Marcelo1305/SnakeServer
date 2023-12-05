const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const BOARD_SIZE = 20;
const canvasX = 1200;
const canvasY = 800;
let snakes = [];
let foods = [];

app.use(express.static('public'));

function generateFood() {
    return {
        x: Math.floor(Math.random() * (canvasX / BOARD_SIZE)),
        y: Math.floor(Math.random() * (canvasY / BOARD_SIZE)),
    };
}

function updateGame() {
    // Atualizar a lógica do jogo aqui (mover a cobra, verificar colisões, gerar alimentos, etc.)
    // Para simplificar, vamos apenas mover a cobra na direção atual

    for (let i = 0; i < snakes.length; i++) {
        const snake = snakes[i];

        // Mover a cobra na direção atual
        const head = { ...snake[0] };
        switch (snake[0].direction) {
            case "UP":
                head.y = (head.y - 1);
                break;
            case "DOWN":
                head.y = (head.y + 1);
                break;
            case "LEFT":
                head.x = (head.x - 1);
                break;
            case "RIGHT":
                head.x = (head.x + 1);
                break;
        }

        // Mover a cobra
        snake.pop(); // Remover o último segmento
        snake.unshift(head); // Adicionar nova cabeça

        // Verificar colisões com a própria cobra
        for (let j = 1; j < snake.length; j++) {
            if (head.x === snake[j].x && head.y === snake[j].y) {
                // A cobra colidiu consigo mesma, reiniciar a cobra
                snakes.splice(i, 1)
            }
        }

        // Verificar colisões com outras cobras
        for (let k = 0; k < snakes.length; k++) {
            if (k !== i) {
                const otherSnake = snakes[k];

                for (let snk = 0; snk < otherSnake.length; snk++) {
                    if (head.x === otherSnake[snk].x && head.y === otherSnake[snk].y) {
                        // elimina a cobra que colidiu
                        snakes.splice(i, 1);
                    }
                }
            }
        }

        // Verificar colisões com as bordas do tabuleiro
        if (head.x < 0 || head.x >= (canvasX / BOARD_SIZE) || head.y < 0 || head.y >= (canvasY / BOARD_SIZE)) {
            // A cobra colidiu com as bordas, eliminar a cobra
            snakes.splice(i, 1);
        }

        // Se a cabeça da cobra colidir com um alimento, gerar novo alimento
        const foodIndex = foods.findIndex((f) => f.x === head.x && f.y === head.y);
        if (foodIndex !== -1) {
            snake.push({ x: head.x, y: head.y }); // Adicionar um novo segmento
            foods.splice(foodIndex, 1); // Remover o alimento
            foods.push(generateFood()); // Gerar novo alimento
        }
    }

    // Enviar estado atualizado do jogo para todos os clientes conectados
    const gameState = { snakes, foods };
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(gameState));
        }
    });
}

function componentToHex(componente) {
    // Converter um componente RGB para formato hexadecimal
    var hex = componente.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

// Configurar a conexão WebSocket
wss.on("connection", (ws) => {
    // Criar uma nova cobra para o cliente conectado
    let vermelho = Math.floor(Math.random() * 256);
    let verde = Math.floor(Math.random() * 256);
    let azul = Math.floor(Math.random() * 256);
    // Criar a string hexadecimal da cor
    var corAleatoria = "#" + componentToHex(vermelho) + componentToHex(verde) + componentToHex(azul);
    const newSnake = [
        {
            x: Math.floor(Math.random() * (canvasX /BOARD_SIZE)),
            y: Math.floor(Math.random() * (canvasY /BOARD_SIZE)),
            direction: ["UP", "DOWN", "LEFT", "RIGHT"][Math.floor(Math.random() * 4)],
            color: corAleatoria
        },
    ];
    snakes.push(newSnake);

    // Enviar estado inicial do jogo
    const gameState = { snakes, foods };
    ws.send(JSON.stringify(gameState));

    // Lidar com mudanças na direção
    ws.on("message", (msg) => {
        const data = JSON.parse(msg);
        if (data.config) {
            console.log(data.config);
            // Atualize as configurações da cobrinha do usuário
            newSnake[0].color = data.config;

            // Envie o estado atualizado para todos os clientes
            const gameState = { snakes, foods };
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(gameState));
                }
            });
        } else if (data.direction) {
            newSnake[0].direction = data.direction;
        }
    });

    // Lidar com desconexão do cliente
    ws.on("close", () => {
        // Remover a cobra desconectada
        const index = snakes.findIndex((snake) => snake === newSnake);
        if (index !== -1) {
            snakes.splice(index, 1);
        }
    });
});

// Gerar alimentos iniciais
for (let i = 0; i < 1; i++) {
    foods.push(generateFood());
}

// Configurar o loop do jogo
setInterval(updateGame, 100);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
