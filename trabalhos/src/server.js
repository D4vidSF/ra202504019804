const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { connectDatabase, disconnectDatabase } = require('./config/database');
const app = require('./app');

async function start() {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
  await connectDatabase(process.env.MONGODB_URI);
  const server = app.listen(port, () => console.log(`API Tasks: http://localhost:${port} | Swagger: /swagger`));
  server.on('error', async () => {
    console.error('Não foi possível abrir a porta HTTP.');
    await disconnectDatabase();
    process.exitCode = 1;
  });
  const shutdown = () => server.close(async () => { await disconnectDatabase(); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch(async () => {
  console.error('Falha ao iniciar. Verifique PORT, MONGODB_URI e se o MongoDB replica set/Atlas está acessível.');
  await disconnectDatabase();
  process.exitCode = 1;
});
