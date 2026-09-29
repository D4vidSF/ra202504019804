const AppError = require('../utils/AppError');

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof AppError) return res.status(err.status).json({ erro: err.message });
  if (err.code === 11000) return res.status(409).json({ erro: 'Já existe um registro com esse nome neste contexto.' });
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ erro: 'Dados inválidos.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ erro: 'Corpo da requisição muito grande.' });
  // Não expor URI, stack ou dados do banco na resposta ou no log.
  console.error('Falha interna:', err.name || 'Error');
  return res.status(500).json({ erro: 'Erro interno inesperado.' });
};
