import * as utils from '../utils.js';
import * as snakeSprite from '../sprites/snake.js';
import * as playerSprite from '../sprites/player.js';
import * as powerupSprite from '../sprites/powerup.js';

const SIZE = 50;
const STARVATION = 0.15;
const TAU = Math.PI * 2; // 180 deg

const POWERUPS = [
  { type: 'speed', img: null },
  { type: 'speed', img: null },
  { type: 'shield', img: null },
  { type: 'shield', img: null },
  { type: 'health', img: null }
];

// --- Initialization ---
POWERUPS.forEach(p => {
  if (!p.img) {
    p.img = new Image();
    p.img.addEventListener('load', () => {
      p.img.width = 32;
      p.img.height = 32;
    });
    p.img.src = `pwr_${p.type}.png`;
  }
});

let snakes = [];
let powerup = null;

function step(context, area) {
  const { players, input, renderContext, network } = context;
  const { dt, ctx, start } = renderContext;
  const { x, y, width, height } = area;
  const player = players[network.clientIndex];

  const timeScale = dt / 70; // This is an arbitrary number that seems to work well.

  // Proceed to first/next level when there are no snakes
  if (network.isHost && !players.some(p => p && !p.ready) && snakes.filter(Boolean).length === 0) {
    snakes = Array(++player.level * 2).fill(0).map(() => ({
      v: { direction: Math.random() * TAU, speed: 3 },
      path: [{ x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) }],
      size: SIZE,
      hue: Math.floor(Math.random() * 360)
    }));
  }

  ctx.clearRect(x, y, width, height);

  // Remove or spawn powerup
  if (powerup) {
    if (Math.random() < timeScale * .001) {
      powerup = null;
    }
  } else if (Math.random() < timeScale * .01) {
    const p = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    powerup = {
      value: 100,
      position: {
        x: Math.floor(Math.random() * (width - p.img.width)),
        y: Math.floor(Math.random() * (height - p.img.height))
      },
      active: false,
      ...p
    };
  }

  // Draw powerup
  if (powerup) {
    powerupSprite.draw(powerup, ctx, area);
  }

  // Move the player
  movePlayer(timeScale, player, input, area);
  player.score += timeScale * .5;

  // Pick up a powerup?
  if (powerup) {
    const poRect = { ...powerup.position, width: powerup.img.width, height: powerup.img.height };
    const plRect = { ...player.position, width: player.img.width, height: player.img.height };

    if (utils.isRectangleCollision(poRect, plRect)) {
      if (powerup.type === 'health') {
        player.health += 10;
      } else {
        player.powerup = powerup;
      }

      powerup = null;
    }
  }

  // Draw all players
  players.forEach(p => {
    if (p && p.position) {
      playerSprite.draw(p, ctx, area);
    }
  });

  // Move and draw snakes
  for (let s = 0; s < snakes.length; s++) {
    const snake = snakes[s];
    if (!snake) continue;

    // Move the snake
    if (network.isHost) {
      moveSnake(timeScale, snake, player, area, start);
    }

    // Bite the player, if in range
    handleBite(snake, player, area);

    // Hunger games
    snake.size -= timeScale * STARVATION;
    if (snake.size <= 1) {
      // Remove the starved snake
      snakes[s] = null;
    }

    // Draw snake
    snakeSprite.draw(snake, ctx, area);
  }

  // Send the player's position to the network
  if (network?.socket?.connected) {
    const p = { i: network.clientIndex, position: player.position };

    // If we're player 1 (host) then also send the snakes' positions
    const message = network.isHost ? {
      p,
      s: snakes.map((snake, i) => ({
        i,
        position: snake?.path[snake.path.length - 1]
      }))
    } : { p };

    network.socket.emit("step", message);
  }
}

function handleBite(snake, player, { width, height }) {
  const head = snake.path[snake.path.length - 1];
  const headRect = { ...head, width: 0, height: 0 };
  const plRect = { ...player.position, width: player.img.width, height: player.img.height };

  if (utils.isRectangleCollision(headRect, plRect)) {
    snake.size += SIZE;

    // TODO: Audio?
    //document.getElementById('death').play();

    // If the snake gets too big, split it into two
    if (snake.size > SIZE * 2) {
      // Keep the front
      snake.path = snake.path.slice(-SIZE);
      snake.size = SIZE;
      // A new snake is born.
      snakes.push({ v: { x: 0, y: 0 }, path: [head], size: SIZE, hue: utils.mod(snake.hue + Math.floor(Math.random() * 90) - 45, 360) });
    }

    // TODO: make this suck less
    // Place the player at a random position
    player.position = {
      x: Math.floor(Math.random() * (width - player.img.width)),
      y: Math.floor(Math.random() * (height - player.img.height))
    };

    player.health -= 10;
    if (player.health <= 0) {
      snakes = [];
    }
  }
}

function movePlayer(timeScale, player, input, { width, height }) {
  if (player.powerup) {
    player.powerup.active = input.shift;
  }

  const diagonal = (input.keys[37] || input.keys[39]) && (input.keys[38] || input.keys[40]);
  const boost = player.powerup && player.powerup.type === 'speed' && player.powerup.active;
  const speed = timeScale * 2.5 * (diagonal ? 1 : Math.SQRT2) * (boost ? 2 : 1);

  // Left - right
  if (input.keys[37]) {
    player.position.x = Math.max(player.position.x - speed, 0);
  } else if (input.keys[39]) {
    player.position.x = Math.min(player.position.x + speed, width - player.img.width);
  }

  // Up - down
  if (input.keys[38]) {
    player.position.y = Math.max(player.position.y - speed, 0);
  } else if (input.keys[40]) {
    player.position.y = Math.min(player.position.y + speed, height - player.img.height);
  }

  // TODO: Move to separate method
  // Handle powerups
  if (player.powerup && player.powerup.active) {
    player.powerup.value -= timeScale * 2;
    if (player.powerup.value <= 0) {
      player.powerup = null;
    }
  }

  if (player.health > 100) {
    player.health = Math.max(player.health - timeScale * .05, 100);
  }
}

function moveSnake(timeScale, snake, player, { width, height }, start) {
  // Only allow to change direction once every n milliseconds
  if (start % 100 < 34) { //FPS_INTERVAL

    // Add something random to the vector
    snake.v.direction += (Math.random() - .5) * Math.PI / 4; // Max direction change

    // Steer towards the player, or away when using the shield
    const shieldActive = player.powerup &&
      player.powerup.type === 'shield' &&
      player.powerup.active &&
      utils.distanceToPlayer(snake, player) <= 100;

    const steerSpeed =  Math.PI / 32 * (shieldActive ? -3 : 1);
    const targetAngle = utils.angleToPlayer(snake, player);

    snake.v.direction = utils.mod(snake.v.direction + (targetAngle === 0 ? 0 :
        (targetAngle < Math.PI ? steerSpeed : -steerSpeed)), TAU);

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
    snake.v.direction = utils.mod(Math.PI - snake.v.direction, TAU);
  }
  if (newPoint.y < 0 || newPoint.y > height) {
    snake.v.direction = utils.mod(0 - snake.v.direction, TAU);
  }

  // Add the new point to the head of the snake
  moveSnakeHead(snake, newPoint);
}

function moveSnakeHead(snake, newPoint) {
  snake.path.push(newPoint);
  while (snake.path.length > snake.size) {
    snake.path.shift();
  }
}

function handleSocketEvent(event, data, network) {
  if (!network.isHost && event === "step" && data?.s?.length) {
    data.s.forEach(remoteSnake => {
      if(!snakes[remoteSnake.i]) {
        snakes[remoteSnake.i] = {
          path: [remoteSnake.position],
          size: SIZE,
          hue: Math.floor(Math.random() * 360) // TODO: sync?
        };
      } else {
        const snake = snakes[remoteSnake.i];
        moveSnakeHead(snake, remoteSnake.position);
      }
    });
  }
}

export default { step, handleSocketEvent }

