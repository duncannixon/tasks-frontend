import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';

import { app } from './app';

let httpsServer: https.Server | null = null;
let httpServer: http.Server | null = null;

// Used by shutdownCheck in readinessChecks
app.locals.shutdown = false;

// TODO: set the right port for your application
const port: number = parseInt(process.env.PORT || '3100', 10);

if (app.locals.ENV !== 'development') {
  const sslDirectory = path.join(__dirname, 'resources', 'localhost-ssl');
  const sslOptions = {
    cert: fs.readFileSync(path.join(sslDirectory, 'localhost.crt')),
    key: fs.readFileSync(path.join(sslDirectory, 'localhost.key')),
  };
  httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(port, () => {
    console.log(`Application started: https://localhost:${port}`);
  });
} else {
  // Wrap in http.Server so we can close it cleanly
  httpServer = http.createServer(app);
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Application started: http://localhost:${port}`);
  });
}

const gracefulShutdownHandler = (signal: string) => {
  console.log(`Caught ${signal}, gracefully shutting down. Setting readiness to DOWN`);
  app.locals.shutdown = true;

  setTimeout(() => {
    console.log('Shutting down application');

    if (httpsServer) {
      httpsServer.close(() => {
        console.log('HTTPS server closed');
        process.exit(0);
      });
    }

    if (httpServer) {
      httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    }

    // If neither server is set, just exit
    if (!httpsServer && !httpServer) {
      process.exit(0);
    }
  }, 4000);
};

process.on('SIGINT', gracefulShutdownHandler);
process.on('SIGTERM', gracefulShutdownHandler);
