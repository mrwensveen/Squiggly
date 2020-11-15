import * as playerSprite from '../sprites/player.js';

function step(context, area) {
  const { players, input, renderContext, network } = context;
  const { ctx } = renderContext;
  const { x, y, width, height } = area;
  const player = players[network.clientIndex];

  ctx.clearRect(x, y, width, height);

  // Draw all players
  players.forEach((p) => {
    if (p && p.position) {
      playerSprite.draw(p, ctx, area);
    }
  });

  ctx.textBaseline = 'top';
  ctx.font = '30px Rubik Mono One';
  ctx.fillStyle = 'black';

  ctx.fillText('WAITING FOR OTHER PLAYERS...', 75, 10);

  if (player.ready) {
    ctx.fillText('READY!', 75, height - 50);
  } else {
    ctx.fillText('PRESS SPACE WHEN READY', 75, height - 50);
  }

  handleWait(player, input, network);
}

function handleWait(player, input, network) {
  if (!player || input.keyUpHandlers.has('lobbyWait')) return;

  input.keyUpHandlers.set('lobbyWait', (event) => {
    if (event.code !== 'Space') return;

    player.ready = true;

    if (network && network.socket && network.socket.connected) {
      const p = { i: network.clientIndex, ready: player.ready };
      const message = { safe: true, p };

      network.socket.emit('step', message);
    }

    // Remove the handler
    input.keyUpHandlers.delete('lobbyWait');
  });
}

export default { step };
