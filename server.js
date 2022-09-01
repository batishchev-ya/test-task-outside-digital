const dotenv = require('dotenv');
process.on('uncaughtException', (err) => {
  console.log('UNHANDLED EXCEPTION!💥 Shutting down...');
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`App runing on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION!💥 Shutting down...');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
process.on('SIGTERM', () => {
  console.log('💥 SIGTERM RECIEVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
