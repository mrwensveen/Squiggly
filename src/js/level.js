import { mod } from './utils.js';

const SIZE = 50;
const STARVATION = 0.15;
const TAU = Math.PI * 2;

let snakes = [];

function step(player, input, { dt, ctx, start }, area) {
  const { x, y, width, height } = area;
  const timeScale = dt / 70; // This is an arbitrary number that seems to work well.

  // Proceed to first/next level when there are no snakes
  if (snakes.filter(Boolean).length === 0) {
    snakes = Array(++player.level * 2).fill(0).map(() => ({
      v: { direction: Math.random() * TAU, speed: 3 },
      path: [{ x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) }],
      size: SIZE,
      hue: Math.floor(Math.random() * 360)
    }));
  }

  ctx.clearRect(x, y, width, height);
  
  // Move the player
  movePlayer(timeScale, player, input, area);
  player.score += timeScale * .5;
  
  for (let s = 0; s < snakes.length; s++) {
    const snake = snakes[s];
    if (!snake) continue;

    // Move the snake
    moveSnake(timeScale, snake, player, area, start);

    // Bite the player, if in range
    const head = snake.path[snake.path.length - 1];
    if (player.position &&
      head.x > player.position.x &&
      head.x < (player.position.x + player.img.width / 2) &&
      head.y > player.position.y &&
      head.y < (player.position.y + player.img.height / 2)
    ) {
      snake.size += SIZE;
      
      // TODO: Audio?
      //document.getElementById('death').play();
      
      // If the snake gets too big, split it into two
      if (snake.size > SIZE * 2) {
        // Keep the front
        snake.path = snake.path.slice(-SIZE);
        snake.size = SIZE;
        
        // A new snake is born.
        snakes.push({ v: { x: 0, y: 0 }, path: [head], size: SIZE, hue: mod(snake.hue + Math.floor(Math.random() * 90) - 45, 360) });
      }
      
      // TODO: make this suck less
      // Place the player at a random position
      player.position = {
        x: Math.floor(Math.random() * (width - player.img.width / 2)),
        y: Math.floor(Math.random() * (height - player.img.height / 2))
      };

      player.health -= 10;

      if (player.health <= 0) {
        snakes = [];
      }
    }
    
    // Hunger games
    snake.size -= timeScale * STARVATION;
    if (snake.size <= 1) {
      // Remove the starved snake
      snakes[s] = null;
    }

    // Draw snake 
    drawSnake(snake, ctx, area);
  }

  // Draw player
  drawPlayer(player, ctx, area);
}
  
function drawSnake(snake, ctx, { x, y }) {
  let currentPoint = snake.path[0];
  for (let i = 1; i < snake.path.length; i++) {
    const nextPoint = snake.path[i];

    ctx.beginPath();
    ctx.moveTo(currentPoint.x + x, currentPoint.y + y);
    ctx.lineTo(nextPoint.x + x, nextPoint.y + y);

    const stroke = `hsla(${snake.hue}, 100%,  50%, ${(i + 1) / snake.path.length})`;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    currentPoint = nextPoint;
  }
}

function drawPlayer(player, ctx, { x, y }) {
  if (player.position) {
    ctx.drawImage(player.img, player.position.x + x, player.position.y + y, player.img.width / 2, player.img.height / 2);
  }
}

function movePlayer(timeScale, player, input, { width, height }) {
  if (!player.position) return;

  const diagonal = (input.keys[37] || input.keys[39]) && (input.keys[38] || input.keys[40]);
  const speed = timeScale * 2.5 * (diagonal ? 1 : Math.SQRT2);

  // Left - right
  if (input.keys[37]) {
    player.position.x = Math.max(player.position.x - speed, 0);
  } else if (input.keys[39]) {
    player.position.x = Math.min(player.position.x + speed, width - player.img.width / 2);
  }
  
  // Up - down
  if (input.keys[38]) {
    player.position.y = Math.max(player.position.y - speed, 0);
  } else if (input.keys[40]) {
    player.position.y = Math.min(player.position.y + speed, height - player.img.height / 2);
  }
}

function moveSnake(timeScale, snake, player, { width, height }, start) {
  // Only allow to change direction once every n milliseconds
  if (start % 100 < 34) { //FPS_INTERVAL

    // Add something random to the vector
    snake.v.direction += (Math.random() - .5) * Math.PI / 4; // Max direction change

    // Steer towards the player
    if (player.position) {
      const steerSpeed =  Math.PI / 32;
      const head = snake.path[snake.path.length - 1];
      const targetVector = {
        x: head.x - (player.position.x + player.img.width / 4),
        y: head.y - (player.position.y  + player.img.height / 4)
      };
      const targetAngle = mod(snake.v.direction - Math.atan2(targetVector.y, targetVector.x), TAU)

      snake.v.direction = mod(snake.v.direction + (targetAngle === 0 ? 0 :
          (targetAngle < Math.PI ? steerSpeed : -steerSpeed)), TAU);
    }
    
    // Max speed
    const maxSpeed = 5, minSpeed = 2;
    snake.v.speed = Math.max(Math.min(snake.v.speed + Math.random() - .5, maxSpeed), minSpeed);

    // Constant speed
    //snake.v.speed = 2;
  }
  
  
  // add the vector to the path
  const lastPoint = snake.path[snake.path.length - 1];
  const newPoint = {
    x: lastPoint.x + (Math.cos(snake.v.direction) * snake.v.speed * timeScale),
    y: lastPoint.y + (Math.sin(snake.v.direction) * snake.v.speed * timeScale)
  };
  
  // bounce
  if (newPoint.x < 0 || newPoint.x > width) {
    snake.v.direction = mod(Math.PI - snake.v.direction, TAU);
  }
  if (newPoint.y < 0 || newPoint.y > height) {
    snake.v.direction = mod(0 - snake.v.direction, TAU);
  }
  
  // Add the new point to the head of the snake
  snake.path.push(newPoint);
  while (snake.path.length > snake.size) {
    snake.path.shift();
  }
}

export default { step }
