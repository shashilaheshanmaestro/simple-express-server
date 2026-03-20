'use strict';

const store = require('../src/todos');

beforeEach(() => {
  store.reset();
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------
describe('Todo store – create', () => {
  test('creates a todo with correct shape', () => {
    const todo = store.create('Buy milk');
    expect(todo).toMatchObject({
      id: expect.any(Number),
      title: 'Buy milk',
      completed: false,
      createdAt: expect.any(String),
    });
  });

  test('auto-increments ids', () => {
    const a = store.create('First');
    const b = store.create('Second');
    expect(b.id).toBe(a.id + 1);
  });

  test('returns a copy, not the internal reference', () => {
    const todo = store.create('Test');
    todo.title = 'Mutated';
    expect(store.getById(todo.id).title).toBe('Test');
  });

  test('createdAt is a valid ISO 8601 timestamp', () => {
    const todo = store.create('Timestamp check');
    expect(() => new Date(todo.createdAt)).not.toThrow();
    expect(new Date(todo.createdAt).toISOString()).toBe(todo.createdAt);
  });

  test('completed defaults to false', () => {
    const todo = store.create('Defaults');
    expect(todo.completed).toBe(false);
  });

  test('ids restart after reset', () => {
    const first = store.create('Before reset');
    store.reset();
    const second = store.create('After reset');
    expect(second.id).toBe(first.id);
  });

  test('stores multiple todos independently', () => {
    store.create('Alpha');
    store.create('Beta');
    store.create('Gamma');
    expect(store.getAll()).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// getAll
// ---------------------------------------------------------------------------
describe('Todo store – getAll', () => {
  test('returns empty array when no todos', () => {
    expect(store.getAll()).toEqual([]);
  });

  test('returns all created todos', () => {
    store.create('A');
    store.create('B');
    expect(store.getAll()).toHaveLength(2);
  });

  test('returns a copy – mutating result does not affect store', () => {
    store.create('Safe');
    const all = store.getAll();
    all.push({ id: 999, title: 'Injected', completed: false, createdAt: '' });
    expect(store.getAll()).toHaveLength(1);
  });

  test('returned todos contain correct titles', () => {
    store.create('First');
    store.create('Second');
    const titles = store.getAll().map((t) => t.title);
    expect(titles).toEqual(['First', 'Second']);
  });
});

// ---------------------------------------------------------------------------
// getById
// ---------------------------------------------------------------------------
describe('Todo store – getById', () => {
  test('returns the correct todo', () => {
    const created = store.create('Find me');
    const found = store.getById(created.id);
    expect(found).toMatchObject({ title: 'Find me' });
  });

  test('returns null for non-existent id', () => {
    expect(store.getById(9999)).toBeNull();
  });

  test('returns null when store is empty', () => {
    expect(store.getById(1)).toBeNull();
  });

  test('returns correct item when multiple todos exist', () => {
    store.create('First');
    const second = store.create('Second');
    store.create('Third');
    expect(store.getById(second.id).title).toBe('Second');
  });

  test('returned object is a copy – mutation does not affect store', () => {
    const created = store.create('Immutable');
    const found = store.getById(created.id);
    found.title = 'Changed externally';
    expect(store.getById(created.id).title).toBe('Immutable');
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------
describe('Todo store – update', () => {
  test('updates title', () => {
    const todo = store.create('Old title');
    const updated = store.update(todo.id, { title: 'New title' });
    expect(updated.title).toBe('New title');
  });

  test('updates completed flag', () => {
    const todo = store.create('Task');
    const updated = store.update(todo.id, { completed: true });
    expect(updated.completed).toBe(true);
  });

  test('can mark completed back to false', () => {
    const todo = store.create('Task');
    store.update(todo.id, { completed: true });
    const updated = store.update(todo.id, { completed: false });
    expect(updated.completed).toBe(false);
  });

  test('returns null for non-existent id', () => {
    expect(store.update(9999, { title: 'X' })).toBeNull();
  });

  test('persists changes when retrieved again', () => {
    const todo = store.create('Persist me');
    store.update(todo.id, { completed: true });
    expect(store.getById(todo.id).completed).toBe(true);
  });

  test('update with both title and completed at once', () => {
    const todo = store.create('Both fields');
    const updated = store.update(todo.id, { title: 'Updated', completed: true });
    expect(updated.title).toBe('Updated');
    expect(updated.completed).toBe(true);
  });

  test('update does not change id or createdAt', () => {
    const todo = store.create('Stable fields');
    const updated = store.update(todo.id, { title: 'Changed' });
    expect(updated.id).toBe(todo.id);
    expect(updated.createdAt).toBe(todo.createdAt);
  });

  test('update returns a copy, not the internal reference', () => {
    const todo = store.create('Copy test');
    const updated = store.update(todo.id, { title: 'New' });
    updated.title = 'Hijacked';
    expect(store.getById(todo.id).title).toBe('New');
  });

  test('omitting a field leaves it unchanged', () => {
    const todo = store.create('Partial update');
    store.update(todo.id, { completed: true });
    // title was not touched
    expect(store.getById(todo.id).title).toBe('Partial update');
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------
describe('Todo store – remove', () => {
  test('removes an existing todo and returns true', () => {
    const todo = store.create('Delete me');
    expect(store.remove(todo.id)).toBe(true);
    expect(store.getById(todo.id)).toBeNull();
  });

  test('returns false for non-existent id', () => {
    expect(store.remove(9999)).toBe(false);
  });

  test('only removes the targeted todo', () => {
    const a = store.create('Keep');
    const b = store.create('Remove');
    store.remove(b.id);
    expect(store.getAll()).toHaveLength(1);
    expect(store.getById(a.id)).not.toBeNull();
  });

  test('store length decreases by 1 after removal', () => {
    store.create('One');
    const two = store.create('Two');
    store.create('Three');
    store.remove(two.id);
    expect(store.getAll()).toHaveLength(2);
  });

  test('removing same id twice returns false on second call', () => {
    const todo = store.create('Once only');
    store.remove(todo.id);
    expect(store.remove(todo.id)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------
describe('Todo store – reset', () => {
  test('clears all todos', () => {
    store.create('A');
    store.create('B');
    store.reset();
    expect(store.getAll()).toEqual([]);
  });

  test('resets id counter so next id starts at 1', () => {
    store.create('Before');
    store.reset();
    const fresh = store.create('After');
    expect(fresh.id).toBe(1);
  });
});
