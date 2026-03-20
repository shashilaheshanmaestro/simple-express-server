'use strict';

const express = require('express');
const todosRouter = require('./routes/todos');

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount todo routes
app.use('/todos', todosRouter);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — must have 4 parameters so Express recognises it as an error middleware
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err.stack || err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
});

module.exports = app;
