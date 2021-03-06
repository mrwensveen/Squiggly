export const TAU = Math.PI * 2; // 180 deg

export function mod(x, m) {
  return ((x % m) + m) % m;
}

export function isRectangleCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width
    && rect1.x + rect1.width > rect2.x
    && rect1.y < rect2.y + rect2.height
    && rect1.y + rect1.height > rect2.y
  );
}

export function angleToPlayer(snake, player) {
  const head = snake.path[snake.path.length - 1];
  const center = playerCenter(player);
  const targetVector = {
    x: head.x - center.x,
    y: head.y - center.y,
  };

  return mod(snake.v.direction - Math.atan2(targetVector.y, targetVector.x), TAU);
}

export function playerCenter(player) {
  return {
    x: player.position.x + player.img.width / 2,
    y: player.position.y + player.img.height / 2,
  };
}

export function distanceToPlayer(snake, player) {
  if (player?.position) {
    const head = snake.path[snake.path.length - 1];
    const center = playerCenter(player);

    return Math.sqrt((head.x - center.x) ** 2 + (head.y - center.y) ** 2);
  }
  return null;
}

export function closestPlayer(snake, players) {
  const { player } = players.filter((p) => p?.position).reduce(closestPlayerReducer, { snake });

  return player;
}

export function allPlayersReady(players) {
  return !players.some((p) => p && !p.ready);
}

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export function randomGameName(length = 7) {
  let name = '';
  for (let i = 0; i < length; i++) {
    name += alphabet[(Math.floor(Math.random() * alphabet.length))];
  }

  return name;
}

function closestPlayerReducer(acc, player) {
  const distance = distanceToPlayer(acc.snake, player);
  return !acc.distance || distance < acc.distance ? { snake: acc.snake, distance, player } : acc;
}
