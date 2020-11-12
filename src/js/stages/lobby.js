import * as playerSprite from '../sprites/player.js';

function step(context, area) {
  const { players, clientIndex, input, renderContext } = context;
  const { ctx } = renderContext;
  const { x, y, width, height } = area;
  const player = players[clientIndex];

  ctx.clearRect(x, y, width, height);

  // Draw all players
  players.forEach(p => {
    if (p && p.position) {
      playerSprite.draw(p, ctx, area);
    }
  });

  ctx.textBaseline = 'top';
  ctx.font = '30px Rubik Mono One';

  ctx.fillText('WAIT FOR OTHER PLAYERS...', 75, 10);
  ctx.fillText('OR PRESS SPACE TO START', 75, height - 50);

  handleWait(player, input);
}

function handleWait(player, input) {
  if (!player || input.keyUpHandlers.has('lobbyWait')) return;

  input.keyUpHandlers.set('lobbyWait', event => {
    if (event.code !== "Space") return;

    player.ready = true;

    // Remove the handler
    input.keyUpHandlers.delete('lobbyWait');
  });
}

export default { step };
