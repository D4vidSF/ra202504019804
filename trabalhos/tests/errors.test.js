const errorHandler = require('../src/middlewares/errorHandler');

test('erro inesperado retorna 500 sem expor detalhes internos', () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  errorHandler(new Error('credencial privada'), {}, res, jest.fn());
  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({ erro: 'Erro interno inesperado.' });
  expect(log.mock.calls.flat().join(' ')).not.toContain('credencial privada');
  log.mockRestore();
});
