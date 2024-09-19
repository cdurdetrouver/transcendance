import { get_user, get_score, update_score, get_leaderboard} from '../../components/user/script.js';


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


const playerImages = {
    idle: new Image(),
    jump1: new Image(),
    jump2: new Image(),
    jump3: new Image()
};

playerImages.idle.src = '../../static/assets/jpg/fly1.png' ;
playerImages.jump1.src = '../../static/assets/jpg/fly2.png' ;
playerImages.jump2.src = '../../static/assets/jpg/fly3.png' ;
playerImages.jump3.src = '../../static/assets/jpg/fly4.png' ;

let currentPlayerImage = playerImages.idle;  // Start with the idle image
let animationFrame = 0;
let isAnimating = false;
let animationInterval;


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
    width: 36,
    height: 42,
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
        ctx.drawImage(currentPlayerImage, this.x, this.y, this.width, this.height);
    }
};

function startJumpAnimation() {
    if (isAnimating) return;

    isAnimating = true;
    animationFrame = 0;

    const animationImages = [playerImages.jump1, playerImages.jump2, playerImages.jump3];
    const animationDuration = 100;  // Time in milliseconds between each frame

    animationInterval = setInterval(() => {
        if (animationFrame < animationImages.length) {
            currentPlayerImage = animationImages[animationFrame];  // Cycle through jump images
            animationFrame++;
        } else {
            currentPlayerImage = playerImages.idle;  // Return to idle image
            clearInterval(animationInterval);  // Stop the animation
            isAnimating = false;
        }
    }, animationDuration);
}

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

        ctx.font = "40px flappyFont";
        ctx.textAlign = "center";                

        ctx.lineWidth = 7;
        ctx.strokeStyle = "black";
        ctx.strokeText(score, canvas.width / 2, 50);

        ctx.fillStyle = "white";
        ctx.fillText(score, canvas.width / 2, 50);

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

document.addEventListener('keydown', async (e) => {
    if (e.code === 'Space') {
        if (gameRunning) {
            player.jump();
			startJumpAnimation();
        } else if (!gameRunning) {
			const leaderboard = await get_leaderboard(); 
			updateLeaderboardUI(leaderboard);  
			const bestScore = await get_score();
			if (bestScore !== null) {
				console.log('Best Score:', bestScore);
			} else {
				console.log('Unable to fetch the best score.');
			}
            startGame();
        }
		else
			alert("User need to be connected !");
    }
});


export function updateLeaderboardUI(leaderboard) {
    const leaderboardElement = document.getElementById('leaderboardGrid');  
    leaderboardElement.innerHTML = ''; 

    if (!leaderboard || leaderboard.length === 0) {
		const noPlayerDiv = document.createElement('div');
        noPlayerDiv.classList.add('noPlayer');
		noPlayerDiv.textContent = "Login to see the leaderboard and participate ";
		leaderboardElement.appendChild(noPlayerDiv);
        return;
    }

    leaderboard.forEach(user => {


		const playerDiv = document.createElement('div');
        playerDiv.classList.add('player');
        playerDiv.textContent = user.username;
        
        // Create player score div
        const scoreDiv = document.createElement('div');
        scoreDiv.classList.add('score');
        scoreDiv.textContent = user.best_score;

        // Append both player and score to the leaderboard grid
        leaderboardElement.appendChild(playerDiv);
        leaderboardElement.appendChild(scoreDiv);
    });
}

const leaderboard = await get_leaderboard(); 
updateLeaderboardUI(leaderboard);  
