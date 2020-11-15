import * as utils from '../utils.js';
import snakeSprite from '../sprites/snake.js';
import playerSprite from '../sprites/player.js';
import powerupSprite from '../sprites/powerup.js';

const SIZE = 50;
const STARVATION = 0.15;
const TAU = Math.PI * 2; // 180 deg

const POWERUPS = [
  { type: 'speed', value: 100, active: false },
  { type: 'speed', value: 100, active: false },
  { type: 'shield', value: 100, active: false },
  { type: 'shield', value: 100, active: false },
  { type: 'health', value: 100, active: false },
];

// --- Initialization ---
let snakes = [];
let powerup = null;

function step(context, area) {
  const { players, input, renderContext, network } = context;
  const { dt, ctx, start } = renderContext;
  const { x, y, width, height } = area;
  const player = players[network.clientIndex];

  const timeScale = dt / 70; // This is an arbitrary number that seems to work well.

  if (utils.allPlayersReady(players)
    && (player.level === 0 || snakes.filter(Boolean).length === 0)) {
    if (network.isHost) {
      // On the host, when all players are ready,
      // proceed to first/next level when there are no snakes
      snakes = Array(++player.level * 2).fill(0).map(() => ({
        v: { direction: Math.random() * TAU, speed: 3 },
        path: [{ x: Math.floor(Math.random() * width), y: Math.floor(Math.random() * height) }],
        size: SIZE,
        hue: Math.floor(Math.random() * 360),
      }));
    } else {
      // On the client, request level state
      network.socket?.emit('init', { safe: true });
    }
  }

  ctx.clearRect(x, y, width, height);

  // Remove or spawn powerup
  if (network.isHost) {
    if (powerup) {
      if (Math.random() < timeScale * 0.001) {
        powerup = null;
      }
    } else if (Math.random() < timeScale * 0.01) {
      const puIndex = Math.floor(Math.random() * POWERUPS.length);
      const pu = POWERUPS[puIndex];
      const puImg = powerupSprite.POWERUP_IMGS.get(pu.type);

      powerup = {
        ...pu,
        i: puIndex,
        position: {
          x: Math.floor(Math.random() * (width - puImg.width)),
          y: Math.floor(Math.random() * (height - puImg.height)),
        },
      };
    }
  }

  // Draw powerup
  if (powerup) {
    powerupSprite.draw({
      ...powerup,
      img: powerupSprite.POWERUP_IMGS.get(powerup.type),
    }, ctx, area);
  }

  // Move the player
  movePlayer(timeScale, player, input, area);
  player.score += timeScale * 0.5;

  // Pick up a powerup?
  if (powerup) {
    const puImg = powerupSprite.POWERUP_IMGS.get(powerup.type);
    const poRect = { ...powerup.position, width: puImg.width, height: puImg.height };
    const plRect = { ...player.position, width: player.img.width, height: player.img.height };

    if (utils.isRectangleCollision(poRect, plRect)) {
      if (powerup.type === 'health') {
        player.health += 10;
      } else {
        player.powerup = powerup;
      }

      powerup = null;

      // Notify other players that you've picked up the powerup
      if (network.socket?.connected) {
        const message = {
          safe: true,
          pu: null,
        };
        network.socket.emit('step', message);
      }
    }
  }

  // Draw all players
  players.forEach((p) => {
    if (p && p.position) {
      playerSprite.draw(p, ctx, area);
    }
  });

  // Move and draw snakes
  for (let snakeIndex = 0; snakeIndex < snakes.length; snakeIndex++) {
    const snake = snakes[snakeIndex];
    if (!snake) continue;

    // Move the snake
    if (network.isHost) {
      moveSnake(timeScale, snake, player, area, start);
    }

    // Bite the player, if in range
    if (handleBite(snake, player, area)) {
      // Send the snake's updated size to the network
      if (network.socket?.connected) {
        const message = {
          safe: true,
          s: [{ i: snakeIndex, size: snake.size }],
        };
        network.socket.emit('step', message);
      }
    }

    // Hunger games
    snake.size -= timeScale * STARVATION;
    if (snake.size <= 1) {
      // Remove the starved snake
      snakes[snakeIndex] = null;
    }

    // Draw snake
    snakeSprite.draw(snake, ctx, area);
  }

  // Send the player's position to the network
  // Also the snakes' info if we're the host
  if (network.socket?.connected) {
    sendSocketStepEvent(network, player);
  }
}

function handleBite(snake, player, { width, height }) {
  const head = snake.path[snake.path.length - 1];
  const headRect = { ...head, width: 0, height: 0 };
  const plRect = { ...player.position, width: player.img.width, height: player.img.height };

  if (utils.isRectangleCollision(headRect, plRect)) {
    snake.size += SIZE;

    // TODO: Make this work in network play
    // If the snake gets too big, split it into two
    // if (snake.size > SIZE * 2) {
    //   // Keep the front
    //   snake.path = snake.path.slice(-SIZE);
    //   snake.size = SIZE;
    //   // A new snake is born.
    //   snakes.push({
    //     v: { x: 0, y: 0 },
    //     path: [head],
    //     size: SIZE,
    //     hue: utils.mod(snake.hue + Math.floor(Math.random() * 90) - 45, 360),
    //   });
    // }

    // TODO: make this suck less
    // Place the player at a random position
    player.position = {
      x: Math.floor(Math.random() * (width - player.img.width)),
      y: Math.floor(Math.random() * (height - player.img.height)),
    };

    player.health -= 10;
    if (player.health <= 0) {
      snakes = [];
    }

    return true;
  }

  return false;
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
    player.health = Math.max(player.health - timeScale * 0.05, 100);
  }
}

function moveSnake(timeScale, snake, player, { width, height }, start) {
  // Only allow to change direction once every n milliseconds
  if (start % 100 < 34) { // FPS_INTERVAL
    // Add something random to the vector
    snake.v.direction += (Math.random() - 0.5) * (Math.PI / 4); // Max direction change

    // Steer towards the player, or away when using the shield
    const shieldActive = player.powerup
      && player.powerup.type === 'shield'
      && player.powerup.active
      && utils.distanceToPlayer(snake, player) <= 100;

    const steerSpeed = (Math.PI / 32) * (shieldActive ? -3 : 1);
    const targetAngle = utils.angleToPlayer(snake, player);

    const steerDirection = (targetAngle !== 0) * (targetAngle < Math.PI ? steerSpeed : -steerSpeed);
    snake.v.direction = utils.mod(snake.v.direction + steerDirection, TAU);

    // Max speed
    const maxSpeed = 5; const
      minSpeed = 2;
    snake.v.speed = Math.max(Math.min(snake.v.speed + Math.random() - 0.5, maxSpeed), minSpeed);

    // Constant speed
    // snake.v.speed = 2;
  }

  // add the vector to the path
  const lastPoint = snake.path[snake.path.length - 1];
  const newPoint = {
    x: lastPoint.x + (Math.cos(snake.v.direction) * snake.v.speed * timeScale),
    y: lastPoint.y + (Math.sin(snake.v.direction) * snake.v.speed * timeScale),
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

function sendSocketStepEvent(network, player) {
  const p = { i: network.clientIndex, position: player.position, powerup: player.powerup };

  // If we're player 1 (host) then also send the snakes' positions and powerups
  const message = network.isHost ? {
    p,
    pu: powerup ? { i: powerup.i, position: powerup.position } : null,
    s: snakes.map((snake, i) => ({
      i,
      position: snake?.path[snake.path.length - 1],
    })),
  } : { p };

  network.socket.emit('step', message);
}

function handleSocketEvent(event, data, context) {
  switch (event) {
    case 'step':
      handleSocketStepEvent(data, context);
      break;
    case 'init':
      handleSocketInitEvent(data, context);
      break;
    default:
      break;
  }
}

function handleSocketStepEvent(data, { network, players }) {
  if (data?.p?.level) {
    // Host player leveled up, then so do we
    // console.log('Client level up!', data);

    players[network.clientIndex].level = data.p.level;

    // This also means we will be getting new snakes
    if (data?.s?.length) {
      snakes = [];
    }
  }

  if (data?.pu !== undefined) {
    if (data?.pu) {
      if (!powerup) {
        powerup = {
          ...POWERUPS[data.pu.i],
          position: data.pu.position,
        };
      }
    } else {
      powerup = null;
    }
  }

  if (data?.s?.length) {
    data.s.forEach((remoteSnake) => {
      const snake = snakes[remoteSnake.i];

      if (!snake) {
        // New snake!
        snakes[remoteSnake.i] = {
          path: [remoteSnake.position],
          size: remoteSnake.size,
          hue: remoteSnake.hue,
        };
      } else if (remoteSnake.size) {
        // The snake has grown
        snake.size = remoteSnake.size;
      } else if (remoteSnake.position !== undefined) {
        if (remoteSnake.position) {
          // The snake has moved
          moveSnakeHead(snake, remoteSnake.position);
        } else {
          // The snake has died
          snakes[remoteSnake.i] = null;
        }
      }
    });
  }
}

function handleSocketInitEvent(data, context) {
  // A new player has arrived while the game has already started
  const { network } = context;

  if (network.isHost) {
    emitLevelStateMessage(context);
  }
}

function emitLevelStateMessage({ network, players }) {
  const player = players[network.clientIndex];

  const message = {
    safe: true,
    p: { i: network.clientIndex, level: player.level },
    s: snakes.map((snake, i) => ({
      i,
      position: snake.path[0],
      size: snake.size,
      hue: snake.hue,
    })),
  };

  network.socket?.emit('step', message);
}

export default { step, handleSocketEvent };
