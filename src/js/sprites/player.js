import * as utils from '../utils.js';
import * as powerupSprite from '../sprites/powerup.js';

export function draw(player, ctx, { x, y }) {
  if (!player.position) return;

  ctx.drawImage(player.img, player.position.x + x, player.position.y + y, player.img.width, player.img.height);

  if (player.powerup && player.powerup.type === 'shield' && player.powerup.active) {
    const center = utils.playerCenter(player);

    const shieldGradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 100);
    shieldGradient.addColorStop(0, 'transparent');
    shieldGradient.addColorStop(.9, 'rgba(0, 127, 255, .3)');
    shieldGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = shieldGradient;
    ctx.fillRect(center.x - 100, center.y - 100, 200, 200);

    ctx.save();
    ctx.globalAlpha = .3;

    const puImg = powerupSprite.POWERUP_IMGS.get(player.powerup.type);
    ctx.drawImage(puImg, center.x - player.powerup.value, center.y - player.powerup.value, player.powerup.value * 2, player.powerup.value * 2);
    ctx.restore();
  }
}
