function draw(snake, ctx, { x, y }) {
  let currentPoint = snake.path[0];

  for (let i = 1; i < snake.path.length; i++) {
    const nextPoint = snake.path[i];

    ctx.beginPath();
    ctx.moveTo(currentPoint.x + x, currentPoint.y + y);
    ctx.lineTo(nextPoint.x + x, nextPoint.y + y);

    const stroke = `hsla(${snake.hue}, 100%,  50%, ${(i + 1) / snake.path.length})`;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    currentPoint = nextPoint;
  }
}

export default draw;
