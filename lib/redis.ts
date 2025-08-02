import Redis, { Redis as RedisClient } from 'ioredis';

let redis: RedisClient | any; // Initialize as undefined
let reconnectAttempts = 0;

// Ensure Redis is initialized
if (!redis) {
  redis = new Redis({
    connectTimeout: 1000,
    commandTimeout: 1000,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    retryStrategy(times: number): number | null {
      reconnectAttempts += 1;
      if (reconnectAttempts <= 2) {
        return 1000; // Retry after 1 second
      }
      return null; // Stop retrying after 2 attempts
    },
  });
}

// Event listeners for the Redis client
redis.on('connect', () => {
  console.log('Redis client connected');
});

redis.on('error', (err: Error) => {
  console.error('Redis connection error:', err);
});

redis.on('reconnecting', () => {
  console.log('Redis client reconnecting');
});

redis.on('end', () => {
  console.log('Redis client connection closed');
});

// Function to check if Redis is connected
export const isConnected = (): boolean => {
  return redis?.status === 'ready' || false;
};

export default redis;
