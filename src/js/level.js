const SIZE = 50;
const STARVATION = 0.15;

let level = 0;
let snakes = [];

function step(player, input, canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  
  // Proceed to first/next level when there are no snakes
  if (snakes.length === 0) {
    snakes = Array(++level * 2).fill(0).map(() => ({
      v: [0, 0],
      path: [[Math.floor(Math.random() * width), Math.floor(Math.random() * height)]],
      size: SIZE,
      hue: Math.floor(Math.random() * 360)
    }));
  }
  
  ctx.clearRect(0, 0, width, height);
  
  // Move the player
  movePlayer(player, input, canvas);
  
  for (let s = 0; s < snakes.length; s++) {
    // Move the snake
    const snake = snakes[s];

    moveSnake(snake, player, canvas);

    // Eat the player, if in range
    const head = snake.path[snake.path.length - 1];
    if (player.position &&
      head[0] > player.position[0] &&
      head[0] < (player.position[0] + player.img.width / 2) &&
      head[1] > player.position[1] &&
      head[1] < (player.position[1] + player.img.height / 2)) {
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
          snakes.push({v: [0, 0], path: [head], size: SIZE, hue: mod(snake.hue + Math.floor(Math.random() * 90) - 45, 360) });
        }
        
        // TODO: make this suck less
        // Place the player at a random position
        player.position = [
          Math.floor(Math.random() * (width - player.img.width / 2)),
          Math.floor(Math.random() * (height - player.img.height / 2))
        ];
    }
    
    // Hunger games
    snake.size -= STARVATION;
    if (snake.size <= 1) {
      // Remove the starved snake
      snakes.splice(s, 1);
    }

    // TODO: Don't draw player for each snake
    // Draw player
    if (player.position) {
      ctx.drawImage(player.img, player.position[0], player.position[1], player.img.width / 2, player.img.height / 2);
    }
      
    // Draw snake 
    let currentPoint = snake.path[0];
      
    for (let i = 1; i < snake.path.length; i++) {
      const nextPoint = snake.path[i];
      ctx.beginPath();
      ctx.moveTo(currentPoint[0], currentPoint[1]);
      ctx.lineTo(nextPoint[0], nextPoint[1]);
      
      const stroke = `hsla(${snake.hue}, 100%,  50%, ${(i + 1) / snake.path.length})`;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      currentPoint = nextPoint;
    }
  }
}
  
function movePlayer(player, input, {width, height}) {
  if (player.position) {
    // Left - right
    if (input.keys[37]) {
      player.position[0] = Math.max(player.position[0] - 2, 0);
    } else if (input.keys[39]) {
      player.position[0] = Math.min(player.position[0] + 2, width - player.img.width / 2);
    }
    
    // Up - down
    if (input.keys[38]) {
      player.position[1] = Math.max(player.position[1] - 2, 0);
    } else if (input.keys[40]) {
      player.position[1] = Math.min(player.position[1] + 2, height - player.img.height / 2);
    }
  }
}

function moveSnake(snake, player, {width, height}) {
  // Add something to the vector
  snake.v[0] += Math.random() * 1 - .5;
  snake.v[1] += Math.random() * 1 - .5;
  
  // Max speed
  snake.v[0] = Math.min(Math.max(snake.v[0], -4), 4);
  snake.v[1] = Math.min(Math.max(snake.v[1], -4), 4);
  
  // Steer towards the player
  const head = snake.path[snake.path.length - 1];
  if (player.position) {
    snake.v[0] += head[0] > (player.position[0] + player.img.width / 4) ? -.1 : .1;
    snake.v[1] += head[1] > (player.position[1]  + player.img.height / 4) ? -.1 : .1;
  }
  
  // add the vector to the path
  const lastPoint = snake.path[snake.path.length - 1];
  const newPoint = [lastPoint[0] + snake.v[0], lastPoint[1] + snake.v[1]];
  
  // bounce
  if (newPoint[0] < 0 || newPoint[0] > width) {
    snake.v[0] *= -1;
  }
  if (newPoint[1] < 0 || newPoint[1] > height) {
    snake.v[1] *= -1;
  }
  
  // Add the new point to the head of the snake
  snake.path.push(newPoint);
  while (snake.path.length > snake.size) {
    snake.path.shift();
  }
}

// --- Utils ---

function mod(x, m) {
  return (x%m + m)%m;
}

export default { step }
