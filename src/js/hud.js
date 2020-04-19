function step(player, _input, ctx, area, state) {
  const {x, y, width, height} = area;

	ctx.clearRect(x, y, width, height);

	ctx.font = '16px bold Arial, Helvetica, sans-serif';
	ctx.textBaseline = 'top';
	ctx.fillText(`LEVEL: ${Math.floor(state.level)}`, 10 + x, 5 + y);
	ctx.fillText(`SCORE: ${Math.floor(player.score)}`, 160 + x, 5 + y);
	ctx.fillText(`HEALTH: ${Math.floor(player.health)}`, 310 + x, 5 + y);
}

export default { step };
