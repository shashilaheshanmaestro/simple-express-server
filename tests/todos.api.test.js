'use strict';

const request = require('supertest');
const app = require('../src/app');
const store = require('../src/todos');

beforeEach(() => {
  store.reset();
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('response Content-Type is JSON', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });
});

// ---------------------------------------------------------------------------
// Unknown routes
// ---------------------------------------------------------------------------
describe('Unknown routes', () => {
  test('returns 404 for unmatched GET route', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });

  test('returns 404 JSON body for unmatched route', async () => {
    const res = await request(app).get('/not-a-real-path');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 404 for unmatched POST route', async () => {
    const res = await request(app).post('/unknown').send({});
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /todos
// ---------------------------------------------------------------------------
describe('GET /todos', () => {
  test('returns 200 and an empty array when no todos exist', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all todos', async () => {
    store.create('First');
    store.create('Second');
    const res = await request(app).get('/todos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('response Content-Type is JSON', async () => {
    const res = await request(app).get('/todos');
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('returned todos have the expected shape', async () => {
    store.create('Shape check');
    const res = await request(app).get('/todos');
    expect(res.body[0]).toMatchObject({
      id: expect.any(Number),
      title: 'Shape check',
      completed: false,
      createdAt: expect.any(String),
    });
  });

  test('todos are returned in insertion order', async () => {
    store.create('Alpha');
    store.create('Beta');
    store.create('Gamma');
    const res = await request(app).get('/todos');
    expect(res.body.map((t) => t.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
});

// ---------------------------------------------------------------------------
// GET /todos/:id
// ---------------------------------------------------------------------------
describe('GET /todos/:id', () => {
  test('returns 200 and the todo when found', async () => {
    const todo = store.create('Find me');
    const res = await request(app).get(`/todos/${todo.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: todo.id, title: 'Find me' });
  });

  test('returns 404 when todo does not exist', async () => {
    const res = await request(app).get('/todos/9999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when id is not a number', async () => {
    const res = await request(app).get('/todos/abc');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 for float id string', async () => {
    const res = await request(app).get('/todos/1.5');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 for id of zero', async () => {
    const res = await request(app).get('/todos/0');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 for negative id', async () => {
    const res = await request(app).get('/todos/-1');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('404 error body contains descriptive message', async () => {
    const res = await request(app).get('/todos/9999');
    expect(res.body.error).toMatch(/9999/);
  });

  test('returns correct todo among multiple', async () => {
    store.create('First');
    const second = store.create('Second');
    store.create('Third');
    const res = await request(app).get(`/todos/${second.id}`);
    expect(res.body.title).toBe('Second');
  });
});

// ---------------------------------------------------------------------------
// POST /todos
// ---------------------------------------------------------------------------
describe('POST /todos', () => {
  test('creates a todo and returns 201', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'New task' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      title: 'New task',
      completed: false,
      createdAt: expect.any(String),
    });
  });

  test('returns 400 when title is missing', async () => {
    const res = await request(app).post('/todos').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when title is empty string', async () => {
    const res = await request(app).post('/todos').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when title is whitespace only', async () => {
    const res = await request(app).post('/todos').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when title is not a string', async () => {
    const res = await request(app).post('/todos').send({ title: 123 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when title is a boolean', async () => {
    const res = await request(app).post('/todos').send({ title: true });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when title is null', async () => {
    const res = await request(app).post('/todos').send({ title: null });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('trims whitespace from title', async () => {
    const res = await request(app).post('/todos').send({ title: '  Trimmed  ' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Trimmed');
  });

  test('new todo has completed set to false', async () => {
    const res = await request(app).post('/todos').send({ title: 'Default completed' });
    expect(res.body.completed).toBe(false);
  });

  test('new todo has a valid createdAt ISO timestamp', async () => {
    const res = await request(app).post('/todos').send({ title: 'Timestamp' });
    expect(new Date(res.body.createdAt).toISOString()).toBe(res.body.createdAt);
  });

  test('response Content-Type is JSON', async () => {
    const res = await request(app).post('/todos').send({ title: 'JSON check' });
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('sequential creates have incrementing ids', async () => {
    const res1 = await request(app).post('/todos').send({ title: 'First' });
    const res2 = await request(app).post('/todos').send({ title: 'Second' });
    expect(res2.body.id).toBe(res1.body.id + 1);
  });
});

// ---------------------------------------------------------------------------
// PUT /todos/:id
// ---------------------------------------------------------------------------
describe('PUT /todos/:id', () => {
  test('updates title and returns 200', async () => {
    const todo = store.create('Old');
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  test('updates completed flag to true', async () => {
    const todo = store.create('Task');
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  test('updates completed flag back to false', async () => {
    const todo = store.create('Task');
    store.update(todo.id, { completed: true });
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ completed: false });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(false);
  });

  test('updates both title and completed at once', async () => {
    const todo = store.create('Original');
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ title: 'New title', completed: true });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New title');
    expect(res.body.completed).toBe(true);
  });

  test('trims whitespace from title on update', async () => {
    const todo = store.create('Before trim');
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ title: '  Trimmed  ' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Trimmed');
  });

  test('returns 404 when todo does not exist', async () => {
    const res = await request(app)
      .put('/todos/9999')
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when no fields are provided', async () => {
    const todo = store.create('Task');
    const res = await request(app).put(`/todos/${todo.id}`).send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when title is empty string', async () => {
    const todo = store.create('Task');
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when title is whitespace only', async () => {
    const todo = store.create('Task');
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when completed is not boolean', async () => {
    const todo = store.create('Task');
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ completed: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when completed is a number', async () => {
    const todo = store.create('Task');
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ completed: 1 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when id is not a number', async () => {
    const res = await request(app).put('/todos/abc').send({ title: 'X' });
    expect(res.status).toBe(400);
  });

  test('update does not change id or createdAt', async () => {
    const todo = store.create('Stable');
    const res = await request(app)
      .put(`/todos/${todo.id}`)
      .send({ title: 'Modified' });
    expect(res.body.id).toBe(todo.id);
    expect(res.body.createdAt).toBe(todo.createdAt);
  });
});

// ---------------------------------------------------------------------------
// DELETE /todos/:id
// ---------------------------------------------------------------------------
describe('DELETE /todos/:id', () => {
  test('deletes a todo and returns 204', async () => {
    const todo = store.create('Remove me');
    const res = await request(app).delete(`/todos/${todo.id}`);
    expect(res.status).toBe(204);
  });

  test('204 response has no body', async () => {
    const todo = store.create('Empty body');
    const res = await request(app).delete(`/todos/${todo.id}`);
    expect(res.text).toBe('');
  });

  test('deleted todo no longer returned by GET', async () => {
    const todo = store.create('Gone');
    await request(app).delete(`/todos/${todo.id}`);
    const res = await request(app).get(`/todos/${todo.id}`);
    expect(res.status).toBe(404);
  });

  test('returns 404 when todo does not exist', async () => {
    const res = await request(app).delete('/todos/9999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when id is not a number', async () => {
    const res = await request(app).delete('/todos/abc');
    expect(res.status).toBe(400);
  });

  test('deleting one todo does not affect others', async () => {
    const a = store.create('Keep A');
    const b = store.create('Delete B');
    const c = store.create('Keep C');
    await request(app).delete(`/todos/${b.id}`);
    const res = await request(app).get('/todos');
    expect(res.body).toHaveLength(2);
    const ids = res.body.map((t) => t.id);
    expect(ids).toContain(a.id);
    expect(ids).toContain(c.id);
    expect(ids).not.toContain(b.id);
  });
});

// ---------------------------------------------------------------------------
// End-to-end workflow
// ---------------------------------------------------------------------------
describe('End-to-end todo lifecycle', () => {
  test('create → read → update → delete', async () => {
    // Create
    const createRes = await request(app).post('/todos').send({ title: 'Lifecycle' });
    expect(createRes.status).toBe(201);
    const { id } = createRes.body;

    // Read
    const readRes = await request(app).get(`/todos/${id}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.title).toBe('Lifecycle');

    // Update
    const updateRes = await request(app)
      .put(`/todos/${id}`)
      .send({ completed: true });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.completed).toBe(true);

    // Verify update persisted
    const verifyRes = await request(app).get(`/todos/${id}`);
    expect(verifyRes.body.completed).toBe(true);

    // Delete
    const deleteRes = await request(app).delete(`/todos/${id}`);
    expect(deleteRes.status).toBe(204);

    // Confirm gone
    const goneRes = await request(app).get(`/todos/${id}`);
    expect(goneRes.status).toBe(404);
  });

  test('list reflects all CRUD operations', async () => {
    // Start empty
    let res = await request(app).get('/todos');
    expect(res.body).toHaveLength(0);

    // Add three
    await request(app).post('/todos').send({ title: 'One' });
    await request(app).post('/todos').send({ title: 'Two' });
    const r3 = await request(app).post('/todos').send({ title: 'Three' });

    res = await request(app).get('/todos');
    expect(res.body).toHaveLength(3);

    // Delete one
    await request(app).delete(`/todos/${r3.body.id}`);
    res = await request(app).get('/todos');
    expect(res.body).toHaveLength(2);
  });
});
