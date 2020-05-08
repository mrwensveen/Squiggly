const BLINK = 750;

let scores = null, fetchedScores = false;
let playerHiscore = null;

function step({ player, input, renderContext }, area) {
  const { ctx, start } = renderContext;
  const { x, y, width, height } = area;
  
  ctx.clearRect(x, y, width, height);

  if (!fetchedScores) {
    fetchedScores = true;

    fetch('/scores')
      .then(response => response.json())
      .then(data => {
        scores = Array.from(data).sort((s1, s2) => s2.score - s1.score).slice(0, 10);
        checkPlayerScore(player, input);
      });
  }

  ctx.textBaseline = 'top';
  ctx.font = '30px Rubik Mono One';

  ctx.fillStyle = verticalGradient(ctx, 10, 35, 'cyan', 'orange', 'purple');
  ctx.fillText('HISCORES', 290, 10);

  if (scores) {
    ctx.font = '22px Rubik Mono One';

    scores.forEach((score, index) => {
      const offsetY = index * 45 + 65;
      ctx.fillStyle = verticalGradient(ctx, offsetY, 30, 'red', 'black');

      // Blink or something
      if (score.name.indexOf('_') === -1 || Math.floor(start / BLINK) % 2) {
        ctx.fillText(`${score.name}   ${score.score}`, 300, offsetY);
      }
    });

    if (fetchedScores && !playerHiscore) {
      ctx.textBaseline = 'bottom';
      ctx.font = '30px Rubik Mono One';
      ctx.fillStyle = verticalGradient(ctx, height - 80, 30, 'black', 'blue', 'white', 'blue', 'black', 'black');
      ctx.fillText('PRESS SPACE TO TRY AGAIN', 75, height - 50);

      handleWait(player, input);
    }
  }
}

function checkPlayerScore(player, input) {
  // See if player has a high score
  const lowest = scores.length < 10 ? 0 : scores.map(s => s.score).reduce((p, c) => Math.min(p, c));

  if (player.score > lowest) {
    playerHiscore = { name: "___", score: Math.floor(player.score), timestamp: Date.now() };
    scores.push(playerHiscore);

    handlePlayerScore(input);
  }

  scores = scores.sort((s1, s2) => s2.score - s1.score).slice(0, 10);
}

function verticalGradient(ctx, offsetY, height, ...colorStops) {
  const gradient = ctx.createLinearGradient(0, offsetY, 0, offsetY + height);
  colorStops.forEach((color, index) => gradient.addColorStop(index / colorStops.length, color));

  return gradient;
}

function handlePlayerScore(input) {
  // Add a keydown handler to allow the user to enter a name
  if (input.keyUpHandlers.has('handlePlayerScore')) return;

  input.keyUpHandlers.set('handlePlayerScore', event => {
    if (event.key.length !== 1) return;

    if (playerHiscore.name.indexOf('_') >= 0) {
      playerHiscore.name = playerHiscore.name.replace('_', event.key.toUpperCase());
    }

    if (playerHiscore.name.indexOf('_') === -1) {
      // Submit the score
      fetch('/scores',  {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(playerHiscore)
      });

      // Remove the handler
      input.keyUpHandlers.delete('handlePlayerScore');
      playerHiscore = null;
    }
  });
}

function handleWait(player, input) {
  if (input.keyUpHandlers.has('handleWait')) return;

  const handlerIndex = input.keyUpHandlers.set('handleWait', event => {
    if (event.code !== "Space") return;

    // TODO: Move this to a more logical place
    player.score = 0;
    player.level = 0;
    player.health = 100;
    player.powerup = null;

    fetchedScores = false;

    // Remove the handler
    input.keyUpHandlers.delete('handleWait');
  });
}

export default { step };
