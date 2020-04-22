import { mod } from './utils.js';

const SIZE = 50;
const STARVATION = 0.15;

let snakes = [];

function step(player, input, { dt, ctx }, area) {
  const { x, y, width, height } = area;
  const timeScale = dt / 70; // This is an arbitrary number that seems to work well.

  // Proceed to first/next level when there are no snakes
  if (snakes.filter(Boolean).length === 0) {
    snakes = Array(++player.level * 2).fill(0).map(() => ({
      v: { x: 0, y: 0 },
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
    moveSnake(timeScale, snake, player, area);

    // Eat the player, if in range
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
      
      if (snake.size > SIZE * 2) {
        // Split the path in two
        const path = snake.path;
        
        // Keep the head
        snake.path = path.slice(-SIZE);
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
    }
    
    // Hunger games
    snake.size -= timeScale * STARVATION;
    if (snake.size <= 1) {
      // Remove the starved snake
      snakes[s] = null;
    }

    // Draw snake 
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

    // Draw player
    if (player.position) {
      ctx.drawImage(player.img, player.position.x + x, player.position.y + y, player.img.width / 2, player.img.height / 2);
    }
  }
}
  
function movePlayer(timeScale, player, input, { width, height }) {
  const speed = timeScale * 2.8;
  if (player.position) {
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
}

function moveSnake(timeScale, snake, player, { width, height }) {
  // Add something to the vector
  snake.v.x += timeScale * (Math.random() - .5);
  snake.v.y += timeScale * (Math.random() - .5);
  
  // Max speed
  const maxSpeed = timeScale * 4;
  snake.v.x = Math.min(Math.max(snake.v.x, -maxSpeed), maxSpeed);
  snake.v.y = Math.min(Math.max(snake.v.y, -maxSpeed), maxSpeed);
  
  // Steer towards the player
  const steerSpeed = timeScale * .1;
  const head = snake.path[snake.path.length - 1];
  if (player.position) {
    snake.v.x += head.x > (player.position.x + player.img.width / 4) ? -steerSpeed : steerSpeed;
    snake.v.y += head.y > (player.position.y  + player.img.height / 4) ? -steerSpeed : steerSpeed;
  }
  
  // add the vector to the path
  const lastPoint = snake.path[snake.path.length - 1];
  const newPoint = { x: lastPoint.x + snake.v.x, y: lastPoint.y + snake.v.y };
  
  // bounce
  if (newPoint.x < 0 || newPoint.x > width) {
    snake.v.x *= -1;
  }
  if (newPoint.y < 0 || newPoint.y > height) {
    snake.v.y *= -1;
  }
  
  // Add the new point to the head of the snake
  snake.path.push(newPoint);
  while (snake.path.length > snake.size) {
    snake.path.shift();
  }
}

// --- Utils ---

export default { step }
