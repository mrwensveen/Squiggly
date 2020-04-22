function step(player, _input, { ctx }, area) {
  const { x, y, width, height } = area;

  ctx.clearRect(x, y, width, height);

  ctx.font = '18px bold Arial, Helvetica, sans-serif';
  ctx.fillStyle = 'black';
  ctx.textBaseline = 'top';
  ctx.fillText(`LEVEL: ${Math.floor(player.level)}`, 10 + x, 5 + y);
  ctx.fillText(`SCORE: ${Math.floor(player.score)}`, 160 + x, 5 + y);
  ctx.fillText(`HEALTH: ${Math.floor(player.health)}`, 310 + x, 5 + y);
}

export default { step };
