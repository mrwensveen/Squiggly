import powerupSprite from '../sprites/powerup.js';

function step(context, area) {
  const { players, renderContext, network } = context;
  const { ctx } = renderContext;
  const { x, y, width, height } = area;
  const player = players[network.clientIndex];

  const top = y + 30;

  ctx.clearRect(x, y, width, height);

  ctx.font = 'bold 16px courier';
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';

  // Score
  ctx.fillText(Math.floor(player.score), 48 + x, top);

  // Health
  ctx.fillText(Math.floor(player.health), 224 + x, top);

  // Powerup
  if (player.powerup) {
    const puImg = powerupSprite.POWERUP_IMGS.get(player.powerup.type);

    ctx.drawImage(puImg, 400, top - 4, 20, 20);
    ctx.fillText(Math.floor(player.powerup.value), 430, top);
  }

  // Level
  ctx.fillText(Math.floor(player.level), 568 + x, top);

  // XXX: Debug info
  ctx.fillText(network.isHost ? 'H' : 'C', 620 + x, top);
}

export default { step };
