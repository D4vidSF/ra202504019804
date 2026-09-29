const express = require('express');
const path = require('node:path');
const swaggerUi = require('swagger-ui-express');
const specification = require('./config/swagger');
const AppError = require('./utils/AppError');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.get('/openapi.json', (req, res) => res.json(specification));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specification));
app.use('/projects', require('./routes/projectRoutes'));
app.use('/tasks', require('./routes/taskRoutes'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use((req, res, next) => next(new AppError(404, 'Rota não encontrada.')));
app.use(require('./middlewares/errorHandler'));
module.exports = app;
