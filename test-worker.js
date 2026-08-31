const { Queue, Worker } = require('bullmq');

async function test() {
  console.log('Testing BullMQ Worker connection...');
  const connection = {
    host: 'pulse-board-rosy-bell.cloud.layerbase.dev',
    port: 6379,
    password: 'MvubEfUPPuxSaOlrPb2BDYab',
    tls: { servername: 'pulse-board-rosy-bell.cloud.layerbase.dev' },
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    family: 0,
    retryStrategy(times) {
      console.warn(`Retry attempt ${times}`);
      return Math.min(times * 100, 10000);
    },
  };

  const queue = new Queue('testQueue', { connection });
  const worker = new Worker('testQueue', async job => {}, { connection });

  queue.on('error', (err) => console.error('Queue Error:', err));
  worker.on('error', (err) => console.error('Worker Error:', err));
  worker.on('failed', (job, err) => console.error('Worker failed:', err));

  console.log('Waiting for connection...');
  
  await queue.waitUntilReady();
  console.log('Queue ready');
  
  await worker.waitUntilReady();
  console.log('Worker ready');
  
  setTimeout(() => {
    console.log('Exiting gracefully');
    process.exit(0);
  }, 5000);
}

test();
