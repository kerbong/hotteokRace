const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const MAP_WIDTH = 4000;
const MAP_HEIGHT = (canvas.height * 2) / 3;
const DOUGH_RADIUS = 20;
const BASE_SPEED = 2;
const DOUGH_COLORS = ["red", "blue", "green", "yellow", "purple"];
let doughs = [];
let obstacles = [];
let rankings = [];
let cameraX = 0;
let gameInterval;
let numDoughs;
let background = "white";

class Dough {
  constructor(x, y, color, name) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.name = name;
    this.isPressed = false;
    this.pressTime = 0;
    this.isSlowed = false;
    this.slowTime = 0;
    this.speed = BASE_SPEED;
    this.speedUpTime = 0;
    this.finished = false;
    this.animationFrame = 0;
    this.face = "o o";
    this.verticalDirection = Math.random() > 0.5 ? 1 : -1;
    this.verticalMovementTimer = 0;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x - cameraX, this.y, DOUGH_RADIUS, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillText(
      this.name,
      this.x - cameraX - DOUGH_RADIUS / 2,
      this.y - DOUGH_RADIUS - 10
    );

    // 애니메이션 프레임에 따른 눈 모양 변경
    if (this.face === "x x") {
      this.drawCrossEye();
    } else if (this.animationFrame % 30 < 15) {
      ctx.fillRect(
        this.x - cameraX - DOUGH_RADIUS / 2,
        this.y - DOUGH_RADIUS / 2,
        4,
        8
      );
      ctx.fillRect(
        this.x - cameraX + DOUGH_RADIUS / 2 - 4,
        this.y - DOUGH_RADIUS / 2,
        4,
        8
      );
    } else {
      ctx.fillRect(
        this.x - cameraX - DOUGH_RADIUS / 2,
        this.y - DOUGH_RADIUS / 2,
        8,
        4
      );
      ctx.fillRect(
        this.x - cameraX + DOUGH_RADIUS / 2 - 8,
        this.y - DOUGH_RADIUS / 2,
        8,
        4
      );
    }
  }

  drawCrossEye() {
    ctx.fillRect(
      this.x - cameraX - DOUGH_RADIUS / 2 - 2,
      this.y - DOUGH_RADIUS / 2,
      4,
      4
    ); // 왼쪽 위
    ctx.fillRect(
      this.x - cameraX - DOUGH_RADIUS / 2 + 2,
      this.y - DOUGH_RADIUS / 2,
      4,
      4
    ); // 오른쪽 위
    ctx.fillRect(
      this.x - cameraX - DOUGH_RADIUS / 2 - 2,
      this.y - DOUGH_RADIUS / 2 + 4,
      4,
      4
    ); // 왼쪽 아래
    ctx.fillRect(
      this.x - cameraX - DOUGH_RADIUS / 2 + 2,
      this.y - DOUGH_RADIUS / 2 + 4,
      4,
      4
    ); // 오른쪽 아래

    ctx.fillRect(
      this.x - cameraX + DOUGH_RADIUS / 2 - 6,
      this.y - DOUGH_RADIUS / 2,
      4,
      4
    ); // 왼쪽 위
    ctx.fillRect(
      this.x - cameraX + DOUGH_RADIUS / 2 - 2,
      this.y - DOUGH_RADIUS / 2,
      4,
      4
    ); // 오른쪽 위
    ctx.fillRect(
      this.x - cameraX + DOUGH_RADIUS / 2 - 6,
      this.y - DOUGH_RADIUS / 2 + 4,
      4,
      4
    ); // 왼쪽 아래
    ctx.fillRect(
      this.x - cameraX + DOUGH_RADIUS / 2 - 2,
      this.y - DOUGH_RADIUS / 2 + 4,
      4,
      4
    ); // 오른쪽 아래
  }

  update() {
    if (!this.finished) {
      if (!this.isPressed && !this.isSlowed) {
        this.speedUpTime++;
        if (this.speedUpTime > 240) {
          this.speed = BASE_SPEED * 1.3;
        } else if (this.speedUpTime > 120) {
          this.speed = BASE_SPEED * 1.1;
        } else {
          this.speed = BASE_SPEED;
        }
        this.x += this.speed;
      } else if (this.isPressed) {
        this.pressTime++;
        if (this.pressTime >= 120) {
          this.isPressed = false;
          this.pressTime = 0;
          this.face = "x x";
        }
      } else if (this.isSlowed) {
        this.x += 1;
        this.slowTime++;
        if (this.slowTime >= 120) {
          this.isSlowed = false;
          this.slowTime = 0;
          this.face = "o o";
        }
      }
      if (this.x >= MAP_WIDTH) {
        this.finished = true;
        if (!rankings.includes(this)) {
          rankings.push(this);
        }
        this.face = Math.random() > 0.5 ? "- -" : "^ ^";
      }
      this.verticalMovementTimer++;
      if (this.verticalMovementTimer > 300) {
        this.y += this.verticalDirection * (BASE_SPEED / 4);
        if (this.y <= DOUGH_RADIUS || this.y >= MAP_HEIGHT - DOUGH_RADIUS) {
          this.verticalDirection *= -1;
        }
      }
      doughs.forEach((otherDough) => {
        if (
          otherDough !== this &&
          Math.abs(this.x - otherDough.x) < DOUGH_RADIUS &&
          Math.abs(this.y - otherDough.y) < DOUGH_RADIUS
        ) {
          this.verticalDirection *= -1;
          otherDough.verticalDirection *= -1;
        }
      });
    }
    this.animationFrame++;
  }
}

class Obstacle {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.timer = 0;
    this.active = true;
  }

  draw() {
    if (this.type === "mine") {
      ctx.fillStyle = "brown";
      ctx.beginPath();
      ctx.arc(
        this.x - cameraX,
        this.y + this.height / 2,
        this.width / 2,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(
        this.x - cameraX,
        this.y + this.height / 2,
        this.width / 4,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.fill();
    } else if (this.type === "press") {
      // 똥모양 픽셀아트의 세부 요소들 (사각형으로 그리기)
      const pixelSize = 3;
      const startX = this.x - cameraX;
      const startY = this.y;

      // 예시로 간단한 똥모양 패턴을 그리기 (자유롭게 변경 가능)
      const poopPattern = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 0, 2, 2, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 2, 1, 1, 2, 2, 1, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 0, 0, 0],
        [0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2, 0, 0],
        [0, 0, 0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 2, 0, 0],
        [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
      ];

      for (let row = 0; row < poopPattern.length; row++) {
        for (let col = 0; col < poopPattern[row].length; col++) {
          if (poopPattern[row][col] === 1) {
            ctx.fillStyle = "saddlebrown";
            ctx.fillRect(
              startX + col * pixelSize,
              startY + row * pixelSize,
              pixelSize,
              pixelSize
            );
          }
          if (poopPattern[row][col] === 2) {
            ctx.fillStyle = "black";
            ctx.fillRect(
              startX + col * pixelSize,
              startY + row * pixelSize,
              pixelSize,
              pixelSize
            );
          }
        }
      }
    }
    if (this.active) {
      ctx.fill();
    }
  }

  update() {
    if (!this.active) {
      this.timer++;
      if (this.timer >= 120) {
        this.active = true;
        this.timer = 0;
      }
    }
  }

  checkCollision(dough) {
    if (
      this.active &&
      dough.x + DOUGH_RADIUS > this.x &&
      dough.x - DOUGH_RADIUS < this.x + this.width &&
      dough.y + DOUGH_RADIUS > this.y &&
      dough.y - DOUGH_RADIUS < this.y + this.height
    ) {
      if (this.type === "mine") {
        dough.isPressed = true;
        dough.face = "x x";
        this.active = false;
        setTimeout(() => {
          dough.face = "o o";
          dough.isPressed = false;
        }, 2000);
      } else if (this.type === "press") {
        dough.isSlowed = true;
        dough.face = "@ @";
        this.active = false;
        setTimeout(() => {
          dough.face = "o o";
          dough.isSlowed = false;
        }, 2000);
      }
    }
  }
}

function drawBackground() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (background === "pokemon") {
    drawPixelArtBackground("pokemon");
  } else if (background === "pororo") {
    drawPixelArtBackground("pororo");
  }
}

function drawPixelArtBackground(type) {
  const pattern = document.createElement("canvas");
  pattern.width = 16;
  pattern.height = 16;
  const pctx = pattern.getContext("2d");
  if (type === "pokemon") {
    // 포켓몬 배경 그리기
    pctx.fillStyle = "yellow";
    pctx.fillRect(0, 0, 16, 16);
    pctx.fillStyle = "red";
    pctx.fillRect(4, 4, 8, 8);
  } else if (type === "pororo") {
    // 뽀로로 배경 그리기
    pctx.fillStyle = "blue";
    pctx.fillRect(0, 0, 16, 16);
    pctx.fillStyle = "white";
    pctx.fillRect(4, 4, 8, 8);
  }
  const patternFill = ctx.createPattern(pattern, "repeat");
  ctx.fillStyle = patternFill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawFinishLine() {
  const finishX = MAP_WIDTH - cameraX;
  ctx.fillStyle = "black";
  ctx.fillRect(finishX, 0, 20, canvas.height);
  for (let i = 0; i < canvas.height; i += 40) {
    ctx.fillStyle = "white";
    ctx.fillRect(finishX, i, 20, 20);
  }
}

function drawMinimap() {
  ctx.strokeStyle = "black";
  ctx.strokeRect(10, 10, 100, 20);
  doughs.forEach((dough) => {
    ctx.fillStyle = dough.color;
    const miniX = (dough.x / MAP_WIDTH) * 100;
    ctx.fillRect(miniX, 10, 4, 20);
  });
}

function generateObstacles() {
  const obstacleTypes = ["mine", "press"];
  for (let i = 1; i < 20; i++) {
    // 장애물 개수를 늘림
    const type =
      obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const x = (MAP_WIDTH / 20) * i;
    const y = Math.random() * (MAP_HEIGHT - 60) + 30;
    const width = 20;
    const height = 20;
    obstacles.push(new Obstacle(x, y, width, height, type));
  }
}

function updateRankings() {
  const rankingDiv = document.getElementById("ranking");
  rankingDiv.innerHTML = "<h3>현재 순위</h3>";
  rankings = doughs.slice().sort((a, b) => b.x - a.x);
  rankings.forEach((dough, index) => {
    const rankingEntry = document.createElement("div");
    rankingEntry.innerText = `${index + 1}. ${dough.name}`;
    rankingDiv.appendChild(rankingEntry);
  });
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawFinishLine();
  doughs.forEach((dough) => dough.update());
  obstacles.forEach((obstacle) => obstacle.update());
  doughs.forEach((dough) => {
    obstacles.forEach((obstacle) => obstacle.checkCollision(dough));
  });
  cameraX = Math.max(
    0,
    Math.min(doughs[0].x - canvas.width / 2, MAP_WIDTH - canvas.width)
  );
  doughs.forEach((dough) => dough.draw());
  obstacles.forEach((obstacle) => obstacle.draw());
  drawMinimap();
  updateRankings();
}

function startGame() {
  numDoughs = parseInt(document.getElementById("numDoughs").value);
  doughs = [];
  rankings = [];
  const doughNamesDiv = document.getElementById("doughNames");
  doughNamesDiv.innerHTML = "";
  for (let i = 0; i < numDoughs; i++) {
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = `Dough ${i + 1}`;
    nameInput.id = `doughName${i}`;
    doughNamesDiv.appendChild(nameInput);
    doughs.push(
      new Dough(
        50,
        (MAP_HEIGHT / numDoughs) * (i + 1),
        DOUGH_COLORS[i % DOUGH_COLORS.length],
        nameInput.value
      )
    );
  }
  obstacles = [];
  generateObstacles();
  background = document.getElementById("backgroundSelect").value;
  document.getElementById("startButton").style.display = "none";
  document.getElementById("pauseButton").style.display = "inline";
  document.getElementById("restartButton").style.display = "inline";
  document.getElementById("numDoughs").style.display = "none";
  doughNamesDiv.style.display = "none";
  gameInterval = setInterval(update, 1000 / 60);
}

function pauseGame() {
  clearInterval(gameInterval);
  document.getElementById("startButton").style.display = "inline";
  document.getElementById("pauseButton").style.display = "none";
  document.getElementById("restartButton").style.display = "inline";
}

function restartGame() {
  clearInterval(gameInterval);
  document.getElementById("startButton").style.display = "inline";
  document.getElementById("pauseButton").style.display = "none";
  document.getElementById("restartButton").style.display = "none";
  const doughNamesDiv = document.getElementById("doughNames");
  doughNamesDiv.innerHTML = "";
  doughNamesDiv.style.display = "block";
  document.getElementById("numDoughs").style.display = "inline";
}

document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("pauseButton").addEventListener("click", pauseGame);
document.getElementById("restartButton").addEventListener("click", restartGame);

restartGame();
