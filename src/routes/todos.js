'use strict';

const { Router } = require('express');
const store = require('../todos');

const router = Router();

/**
 * Parse and validate a route :id parameter.
 * Returns a positive integer, or null if the value is not a safe positive integer string.
 *
 * @param {string} raw - the raw string value from req.params.id
 * @returns {number|null}
 */
function parseId(raw) {
  const id = parseInt(raw, 10);
  // Must be a whole positive integer whose string representation matches exactly
  if (isNaN(id) || id <= 0 || String(id) !== raw) return null;
  return id;
}

// GET /todos – list all todos
router.get('/', (req, res) => {
  res.json(store.getAll());
});

// GET /todos/:id – get a single todo
router.get('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const todo = store.getById(id);
  if (!todo) {
    return res.status(404).json({ error: `Todo with id ${id} not found` });
  }

  res.json(todo);
});

// POST /todos – create a new todo
router.post('/', (req, res) => {
  const body = req.body || {};
  const { title } = body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'title is required and must be a non-empty string' });
  }

  const todo = store.create(title.trim());
  res.status(201).json(todo);
});

// PUT /todos/:id – update a todo
router.put('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const body = req.body || {};
  const { title, completed } = body;

  // At least one field must be provided
  if (title === undefined && completed === undefined) {
    return res.status(400).json({ error: 'At least one of title or completed must be provided' });
  }

  // Validate title if provided
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'title must be a non-empty string' });
  }

  // Validate completed if provided
  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'completed must be a boolean' });
  }

  const fields = {};
  if (title !== undefined) fields.title = title.trim();
  if (completed !== undefined) fields.completed = completed;

  const todo = store.update(id, fields);
  if (!todo) {
    return res.status(404).json({ error: `Todo with id ${id} not found` });
  }

  res.json(todo);
});

// DELETE /todos/:id – delete a todo
router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const deleted = store.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: `Todo with id ${id} not found` });
  }

  res.status(204).send();
});

module.exports = router;
