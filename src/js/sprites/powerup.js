export const POWERUP_IMGS = new Map(
  ['speed', 'shield', 'health'].map((type) => {
    const img = new Image();
    img.addEventListener('load', () => {
      img.width = 32;
      img.height = 32;
    });
    img.src = `pwr_${type}.png`;

    return [type, img];
  }),
);

function draw(powerup, ctx, { x, y }) {
  ctx.drawImage(
    powerup.img,
    powerup.position.x + x,
    powerup.position.y + y,
    powerup.img.width,
    powerup.img.height,
  );
}

export default draw;
