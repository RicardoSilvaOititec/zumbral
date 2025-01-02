const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const players = new Map();
let zombieSpawnInterval;

server.on('connection', (ws) => {
  const playerId = Math.random().toString(36).substr(2, 9);
  console.log(`Player connected with id ${playerId}`);
  players.set(playerId, ws);

  ws.send(
    JSON.stringify({
      type: 'init',
      id: playerId,
    })
  );

  if (players.size === 1) {
    zombieSpawnInterval = setInterval(() => {
      const zombieMessage = {
        type: 'zombieSpawn',
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
      };

      broadcast(zombieMessage);
    }, 5000);
  }

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'playerUpdate':
        broadcast(data, ws);
        break;
      case 'playerDeath':
        console.log(`Player ${data.id} died`);
        broadcast(data);
        players.delete(data.id);
        break;
    }
  });

  ws.on('close', () => {
    players.delete(playerId);
    broadcast({
      type: 'playerDeath',
      id: playerId,
    });

    if (players.size === 0 && zombieSpawnInterval) {
      clearInterval(zombieSpawnInterval);
    }
  });
});

function broadcast(message, exclude = null) {
  for (const client of players.values()) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

console.log('Zumbral server running on port 3000');
