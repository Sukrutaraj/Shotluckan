// ----- CANVAS -----
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let centerX = canvas.width / 2;
let centerY = canvas.height / 2;

let playerAngle = 0;
let bullets = [];
let enemies = [];
let particles = [];
let score = 0;
let lives = 5;

// Fiender spawn interval (ms)
let spawnInterval = 800;

// ----- LADDAR LJUD -----
const laserSound = new Audio("laser.mp3");
const explosionSound = new Audio("explosion.mp3");
const gameoverSound = new Audio("gameover.mp3");

// ----- LADDAR BILDER -----
const playerImg = new Image();
playerImg.src = "player.png";

// Ladda 8 fiender
const enemyImages = [];
for (let i = 1; i <= 8; i++) {
    const img = new Image();
    img.src = `enemy${i}.png`;
    enemyImages.push(img);
}

// ----- ROTATION -----
canvas.addEventListener("mousemove", (e) => {
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    playerAngle = Math.atan2(dy, dx);
});

canvas.addEventListener("touchmove", (e) => {
    let t = e.touches[0];
    let dx = t.clientX - centerX;
    let dy = t.clientY - centerY;
    playerAngle = Math.atan2(dy, dx);
});

// ----- SKJUTA -----
canvas.addEventListener("click", shoot);
canvas.addEventListener("touchstart", shoot);

function shoot() {
    bullets.push({
        x: centerX,
        y: centerY,
        angle: playerAngle,
        speed: 6
    });
    laserSound.currentTime = 0;
    laserSound.play();
}

// ----- DRAW PLAYER -----
function drawPlayer() {
    const size = 63; // player.png 50% större
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(playerAngle);
    ctx.drawImage(playerImg, -size / 2, -size / 2, size, size);
    ctx.restore();
}

// ----- BULLETS -----
function updateBullets() {
    bullets.forEach((b, index) => {
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;

        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });
}

function drawBullets() {
    ctx.fillStyle = "cyan";
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ----- FIENDER -----
function spawnEnemy() {
    const size = 42; // fiender 42px
    let side = Math.floor(Math.random() * 4);
    let x, y;

    if (side === 0) { x = Math.random() * canvas.width; y = -size; }
    if (side === 1) { x = canvas.width + size; y = Math.random() * canvas.height; }
    if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + size; }
    if (side === 3) { x = -size; y = Math.random() * canvas.height; }

    const imgIndex = Math.floor(Math.random() * enemyImages.length);

    enemies.push({
        x: x,
        y: y,
        radius: size / 2,
        speed: 0.6 + score * 0.03,
        img: enemyImages[imgIndex]
    });
}

function updateEnemies() {
    enemies.forEach((enemy, eIndex) => {
        let dx = centerX - enemy.x;
        let dy = centerY - enemy.y;
        let dist = Math.hypot(dx, dy);
        let angle = Math.atan2(dy, dx);

        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Kollision med skott
        bullets.forEach((b, bIndex) => {
            let bDist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            if (bDist < enemy.radius) {
                createExplosion(enemy.x, enemy.y);
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                explosionSound.currentTime = 0;
                explosionSound.play();
                score++;
            }
        });

        // Kollision med spelare
        const playerRadius = 63 / 2;
        let playerDist = Math.hypot(centerX - enemy.x, centerY - enemy.y);
        if (playerDist < enemy.radius + playerRadius) {
            enemies.splice(eIndex, 1);
            lives--;
            if (lives <= 0) {
                gameoverSound.play();
                setTimeout(() => {
                    alert("Game Over! Poäng: " + score);
                    location.reload();
                }, 100); // liten fördröjning för ljudet
            }
        }
    });
}

function drawEnemies() {
    const size = 42;
    enemies.forEach(enemy => {
        ctx.drawImage(enemy.img, enemy.x - size / 2, enemy.y - size / 2, size, size);
    });
}

// ----- EXPLOSION -----
function createExplosion(x, y) {
    const particleCount = 6;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x,
            y: y,
            speed: Math.random() * 3 + 1,
            angle: Math.random() * Math.PI * 2,
            radius: Math.random() * 3 + 1,
            alpha: 1
        });
    }
}

function updateParticles() {
    particles.forEach((p, index) => {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        p.alpha -= 0.02;

        ctx.fillStyle = `rgba(255, 200, 50, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        if (p.alpha <= 0) {
            particles.splice(index, 1);
        }
    });
}

// ----- POÄNG & LIV -----
function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Poäng: " + score, 10, 30);
    ctx.fillText("Liv: " + lives, 10, 60);
}

// ----- GAME LOOP -----
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateEnemies();
    updateBullets();
    updateParticles();

    drawEnemies();
    drawBullets();
    drawPlayer(); // spelaren sist
    drawScore();

    requestAnimationFrame(gameLoop);
}

// Starta fiender
setInterval(spawnEnemy, spawnInterval);

// Starta spelet
gameLoop();
