import { mod } from './utils.js';

const SIZE = 50;
const STARVATION = 0.15;

let level = 0;
let snakes = [];

function step(player, input, ctx, area, state) {
  const {x, y, width, height} = area;

  // Proceed to first/next level when there are no snakes
  if (snakes.filter(Boolean).length === 0) {
    snakes = Array(++level * 2).fill(0).map(() => ({
      v: {x: 0, y: 0},
      path: [{x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height)}],
      size: SIZE,
      hue: Math.floor(Math.random() * 360)
    }));
  }
  
  ctx.clearRect(x, y, width, height);
  
  // Move the player
  movePlayer(player, input, area);
  player.score += .5;
  
  for (let s = 0; s < snakes.length; s++) {
    const snake = snakes[s];
    if (!snake) continue;

    // Move the snake
    moveSnake(snake, player, area);

    // Eat the player, if in range
    const head = snake.path[snake.path.length - 1];
    if (player.position &&
      head.x > player.position.x &&
      head.x < (player.position.x + player.img.width / 2) &&
      head.y > player.position.y &&
      head.y < (player.position.y + player.img.height / 2)) {
        snake.size += SIZE;
        
        // TODO: Audio
        //document.getElementById('death').play();
        
        if (snake.size > SIZE * 2) {
          // Split the path in two
          const path = snake.path;
          
          // Keep the head
          snake.path = path.slice(-SIZE);
          snake.size = SIZE;
          
          // A new snake is born.
          snakes.push({v: {x: 0, y: 0}, path: [head], size: SIZE, hue: mod(snake.hue + Math.floor(Math.random() * 90) - 45, 360) });
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
    snake.size -= STARVATION;
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

  state.level = level;
}
  
function movePlayer(player, input, {width, height}) {
  if (player.position) {
    // Left - right
    if (input.keys[37]) {
      player.position.x = Math.max(player.position.x - 3, 0);
    } else if (input.keys[39]) {
      player.position.x = Math.min(player.position.x + 3, width - player.img.width / 2);
    }
    
    // Up - down
    if (input.keys[38]) {
      player.position.y = Math.max(player.position.y - 3, 0);
    } else if (input.keys[40]) {
      player.position.y = Math.min(player.position.y + 3, height - player.img.height / 2);
    }
  }
}

function moveSnake(snake, player, {width, height}) {
  // Add something to the vector
  snake.v.x += Math.random() * 1 - .5;
  snake.v.y += Math.random() * 1 - .5;
  
  // Max speed
  snake.v.x = Math.min(Math.max(snake.v.x, -4), 4);
  snake.v.y = Math.min(Math.max(snake.v.y, -4), 4);
  
  // Steer towards the player
  const head = snake.path[snake.path.length - 1];
  if (player.position) {
    snake.v.x += head.x > (player.position.x + player.img.width / 4) ? -.1 : .1;
    snake.v.y += head.y > (player.position.y  + player.img.height / 4) ? -.1 : .1;
  }
  
  // add the vector to the path
  const lastPoint = snake.path[snake.path.length - 1];
  const newPoint = {x: lastPoint.x + snake.v.x, y: lastPoint.y + snake.v.y};
  
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
