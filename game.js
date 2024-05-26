const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const MAP_WIDTH = 3000; // 전체 맵의 너비
const MAP_HEIGHT = 700; // 전체 맵의 높이
const CANVAS_WIDTH = 800; // 캔버스의 너비
const CANVAS_HEIGHT = 700; // 캔버스의 높이
const DOUGH_RADIUS = 20; // 도우의 반지름
const BASE_SPEED = 2; // 기본 속도
const MINIMAP_SCALE = 0.1;
const MINIMAP_WIDTH = MAP_WIDTH * MINIMAP_SCALE;
const MINIMAP_HEIGHT = MAP_HEIGHT * MINIMAP_SCALE;
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
    // 픽셀 아트로 원 형태 그리기
    const pixelSize = 4; // 픽셀 크기
    const pattern = [
      [0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 0, 0],
    ];

    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        if (pattern[row][col] === 1) {
          ctx.fillStyle = this.color;
          ctx.fillRect(
            this.x - cameraX + (col - 3) * pixelSize,
            this.y + (row - 3) * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }

    // 얼굴 그리기
    ctx.fillStyle = "black";
    ctx.fillText(
      this.name,
      this.x - cameraX - DOUGH_RADIUS / 2,
      this.y - DOUGH_RADIUS - 10
    );
    ctx.fillText(
      this.face,
      this.x - cameraX - DOUGH_RADIUS / 2,
      this.y - DOUGH_RADIUS - 25
    );

    // 애니메이션 프레임 변경
    if (this.animationFrame % 30 < 15) {
      // X 눈 모양
      ctx.fillRect(this.x - cameraX - 6, this.y - 4, 4, 4); // 왼쪽 눈
      ctx.fillRect(this.x - cameraX + 2, this.y - 4, 4, 4); // 오른쪽 눈
      ctx.fillRect(this.x - cameraX - 4, this.y - 6, 4, 4); // 왼쪽 눈
      ctx.fillRect(this.x - cameraX + 4, this.y - 6, 4, 4); // 오른쪽 눈
    } else {
      // o 눈 모양
      ctx.fillRect(this.x - cameraX - 4, this.y - 4, 4, 8); // 왼쪽 눈
      ctx.fillRect(this.x - cameraX + 4, this.y - 4, 4, 8); // 오른쪽 눈
    }
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
          this.face = "o o";
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

      if (this.x >= MAP_WIDTH - 50) {
        // 결승선을 약간 안쪽으로 이동
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

// 결승선 표시
function drawFinishLine() {
  const pixelSize = 2;
  const finishX = MAP_WIDTH - 50;
  for (let y = 0; y < CANVAS_HEIGHT; y += pixelSize * 2) {
    ctx.fillStyle = "red";
    ctx.fillRect(finishX - cameraX, y, pixelSize, pixelSize);
  }
}

function drawMinimap() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(10, 10, MINIMAP_WIDTH, MINIMAP_HEIGHT);

  doughs.forEach((dough) => {
    ctx.fillStyle = dough.color;
    ctx.fillRect(
      10 + dough.x * MINIMAP_SCALE,
      10 + dough.y * MINIMAP_SCALE,
      DOUGH_RADIUS * MINIMAP_SCALE,
      DOUGH_RADIUS * MINIMAP_SCALE
    );
  });

  ctx.strokeStyle = "red";
  ctx.strokeRect(
    10 + cameraX * MINIMAP_SCALE,
    10,
    canvas.width * MINIMAP_SCALE,
    MINIMAP_HEIGHT
  );
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
  cameraX += BASE_SPEED;

  drawBackground();
  drawFinishLine();

  doughs.forEach((dough) => {
    dough.update();
    dough.draw();
    obstacles.forEach((obstacle) => obstacle.checkCollision(dough));
  });

  obstacles.forEach((obstacle) => {
    obstacle.update();
    obstacle.draw();
  });

  drawMinimap();

  if (cameraX > MAP_WIDTH - canvas.width) {
    cameraX = MAP_WIDTH - canvas.width;
  }

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

function updateDoughNames() {
  const numDoughs = parseInt(document.getElementById("numDoughs").value);
  const doughNamesContainer = document.getElementById("doughNames");
  doughNamesContainer.innerHTML = "";

  for (let i = 0; i < numDoughs; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = `doughName${i}`;
    input.placeholder = `Dough ${i + 1} Name`;
    doughNamesContainer.appendChild(input);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("numDoughs")
    .addEventListener("input", updateDoughNames);

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (
      x >= 10 &&
      x <= 10 + MINIMAP_WIDTH &&
      y >= 10 &&
      y <= 10 + MINIMAP_HEIGHT
    ) {
      const mapX = (x - 10) / MINIMAP_SCALE;
      cameraX = mapX - canvas.width / 2;
      if (cameraX < 0) cameraX = 0;
      if (cameraX > MAP_WIDTH - canvas.width)
        cameraX = MAP_WIDTH - canvas.width;
    }
  });

  updateDoughNames();
});

restartGame();
