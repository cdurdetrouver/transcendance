const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT = 300;
const OBSTACLE_SPACING = 300;

let player = {
    x: 100,
    y: canvas.height / 2,
    width: 30,
    height: 30,
    velocityY: 0,
    jump() {
        this.velocityY = JUMP_STRENGTH;
    },
    update() {
        this.velocityY += GRAVITY;
        this.y += this.velocityY;
        
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velocityY = 0;
        } else if (this.y < 0) {
            this.y = 0;
            this.velocityY = 0;
        }
    },
    draw() {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
};

let obstacles = [];
let frameCount = 0;
let gameRunning = false;

function startGame() {
    gameRunning = true;
    obstacles = [];
    frameCount = 0;
    player.y = canvas.height / 2;
    player.velocityY = 0;
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    frameCount++;
    if (frameCount % 100 === 0) {
        let obstacleHeight = Math.random() * (canvas.height - OBSTACLE_HEIGHT);
        obstacles.push({
            x: canvas.width,
            y: obstacleHeight,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT
        });
    }
    
    player.update();
    player.draw();
    
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= 3;
        ctx.fillStyle = 'black';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.fillRect(obstacle.x, obstacle.y + OBSTACLE_HEIGHT + 100, obstacle.width, canvas.height - (obstacle.y + OBSTACLE_HEIGHT + 100));
        
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
        
        if (collisionDetection(player, obstacle)) {
            gameRunning = false;
            alert("Game Over!");
        }
    });
    
    requestAnimationFrame(gameLoop);
}

function collisionDetection(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameRunning) {
            player.jump();
        } else {
            startGame();
        }
    }
});

canvas.addEventListener('click', () => {
    if (gameRunning) {
        player.jump();
    } else {
        startGame();
    }
});
