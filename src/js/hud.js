function step(player, _input, { ctx }, area) {
  const { x, y, width, height } = area;
  const top = y + 30;

  ctx.clearRect(x, y, width, height);

  ctx.font = 'bold 16px courier';
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';

  ctx.fillText(Math.floor(player.score), 48 + x, top);

  // TODO: Health bar
  ctx.fillText(Math.floor(player.health), 224 + x, top);

  // TODO: Powerup + bar

  ctx.fillText(Math.floor(player.level), 568 + x, top);
}

export default { step };
