export function draw(powerup, ctx, { x, y }) {
	ctx.drawImage(powerup.img, powerup.position.x + x, powerup.position.y + y, powerup.img.width, powerup.img.height);
}
