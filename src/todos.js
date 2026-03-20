'use strict';

/**
 * In-memory Todo data store.
 * Each todo: { id, title, completed, createdAt }
 */

let todos = [];
let nextId = 1;

/**
 * Reset the store (useful in tests).
 */
function reset() {
  todos = [];
  nextId = 1;
}

/**
 * Return all todos.
 * @returns {Array}
 */
function getAll() {
  return [...todos];
}

/**
 * Return a single todo by id, or null if not found.
 * @param {number} id
 * @returns {Object|null}
 */
function getById(id) {
  const todo = todos.find((t) => t.id === id);
  return todo ? { ...todo } : null;
}

/**
 * Create a new todo.
 * @param {string} title
 * @returns {Object} the created todo
 */
function create(title) {
  const todo = {
    id: nextId++,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  return { ...todo };
}

/**
 * Update an existing todo. Returns the updated todo or null if not found.
 * @param {number} id
 * @param {{ title?: string, completed?: boolean }} fields
 * @returns {Object|null}
 */
function update(id, fields) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return null;

  if (fields.title !== undefined) todo.title = fields.title;
  if (fields.completed !== undefined) todo.completed = fields.completed;

  return { ...todo };
}

/**
 * Delete a todo by id. Returns true if deleted, false if not found.
 * @param {number} id
 * @returns {boolean}
 */
function remove(id) {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  return true;
}

module.exports = { reset, getAll, getById, create, update, remove };
