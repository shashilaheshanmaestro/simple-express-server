'use strict';

const app = require('./app');

const PORT = process.env.PORT || 3000;

// Only bind the TCP port when this file is the entry point.
// When required by tests (or other modules) the app is exported without
// starting a server so there is no open-handle leak.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Todo server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
