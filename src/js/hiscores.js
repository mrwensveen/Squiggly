const BLINK = 750;

let scores = null, fetchedScores = false;
let playerHiscore = null;

function step(player, _input, { ctx, start }, area) {
  const { x, y, width, height } = area;

  if (!scores && !fetchedScores) {
    fetchedScores = true;
    fetch('/scores')
      .then(response => response.json())
      .then(data => {
        scores = Array.from(data);

        // See if player has a high score
        const lowest = scores.length < 10 ? 0 : scores.map(s => s.score).reduce(Math.min);

        if (player.score > lowest) {
          playerHiscore = { name: "___", score: Math.floor(player.score), timestamp: Date.now() };
          scores.push(playerHiscore);
        }

        scores = scores.sort((s1, s2) => s2.score - s1.score).slice(0, 10);
      });
  }

  ctx.clearRect(x, y, width, height);

  ctx.textBaseline = 'top';
  ctx.font = '30px Rubik Mono One';

  const headingGradient = verticalGradient(ctx, 10, 35, 'cyan', 'orange', 'purple');
  ctx.fillStyle = headingGradient;
  ctx.fillText('HISCORES', 290, 10);

  if (scores) {
    ctx.font = '22px Rubik Mono One';

    scores.forEach((score, index) => {
      const offsetY = index * 50 + 80;
      const scoreGradient = verticalGradient(ctx, offsetY, 30, 'red', 'black');
      ctx.fillStyle = scoreGradient;

      // Blink or something
      if (score.name.indexOf('_') === -1 || Math.floor(start / BLINK) % 2) {
        ctx.fillText(`${score.name}   ${score.score}`, 300, offsetY);
      }
    });
  }
}

function verticalGradient(ctx, offsetY, height, ...colorStops) {
  const gradient = ctx.createLinearGradient(0, offsetY, 0, offsetY + height);
  colorStops.forEach((color, index) => gradient.addColorStop(index / colorStops.length, color));

  return gradient;
}

export default { step };
