import { get_user, get_score, update_score } from '../../components/user/script.js';


let userElement = document.querySelector('#user_username');
let isConnected = false;
const user =await get_user();

if (user)
{
	userElement.innerText = `${user.username} is connected`;
	isConnected = true;
}
else
{
	userElement.innerText = 'No user connected';
	isConnected = false;
}


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.2;
const JUMP_STRENGTH = -5.5;
const OBSTACLE_WIDTH = 60;
const HOLE_HEIGHT = 200;
const OBSTACLE_SPACING = 300;
const HOLE_MIN_HEIGHT = 100;
const HOLE_MAX_HEIGHT = 400;

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
let gameRunning = false;
let score = 0;
let gameSpeed = 0;
let nextObstacleX = canvas.width;

let gameInterval;
const FPS = 60; 
const intervalTime = 1000 / FPS;  

function startGame() {
    gameRunning = true;
    obstacles = [];
    score = 0;
    player.y = canvas.height / 2;
    player.velocityY = 0;
	nextObstacleX = canvas.width;

    gameInterval = setInterval(gameLoop, intervalTime);
}

function stopGame() {
    clearInterval(gameInterval);
    gameRunning = false;
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - OBSTACLE_SPACING) {
        let holeY = HOLE_MIN_HEIGHT + Math.random() * (HOLE_MAX_HEIGHT - HOLE_MIN_HEIGHT);

		nextObstacleX = canvas.width;

        obstacles.push({
            x: nextObstacleX,
            width: OBSTACLE_WIDTH,
            holeY: holeY
        });
    }

    player.update();
    player.draw();

    obstacles = obstacles.filter(obstacle =>  {
        obstacle.x -= 3 + gameSpeed;
        if (obstacle.x + obstacle.width < 0) {
            score++;
			gameSpeed += 0.1;
            return false;
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(obstacle.x, 0, obstacle.width, obstacle.holeY);
        ctx.fillRect(obstacle.x, obstacle.holeY + HOLE_HEIGHT, obstacle.width, canvas.height - (obstacle.holeY + HOLE_HEIGHT));

        if (collisionDetection(player, obstacle)) {
            stopGame();
			update_score(score).then(response => {
				console.log('update', response);
				alert(`Game Over! Your score: ${score}`);
				gameSpeed = 0;
				return false;
			})
        }

        return true;
    });
}

function collisionDetection(rect1, obstacle) {
    const topObstacleHeight = obstacle.holeY;
    const bottomObstacleY = obstacle.holeY + HOLE_HEIGHT;

    return (
        rect1.x < obstacle.x + obstacle.width &&
        rect1.x + rect1.width > obstacle.x &&
        (
            rect1.y < topObstacleHeight ||
            rect1.y + rect1.height > bottomObstacleY
        )
    );
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameRunning) {
            player.jump();
        } else if (!gameRunning) {
			get_score().then(bestScore => {
				if (bestScore !== null) {
					console.log('Best Score:', bestScore);
				} else {
					console.log('Unable to fetch the best score.');
				}
			});
            startGame();
        }
		else
			alert("User need to be connected !");
    }
});

// canvas.addEventListener('click', () => {
//     if (gameRunning) {
//         player.jump();
//     } else if (isConnected == true){
//         startGame();
//     }
// });
