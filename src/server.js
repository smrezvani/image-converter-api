import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import config from './config/index.js';
import imageRoutes from './routes/image.routes.js';

const fastify = Fastify({
  logger: {
    level: config.logging.level,
    ...(config.server.nodeEnv === 'development' && {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true
        }
      }
    })
  },
  bodyLimit: config.upload.maxFileSize,
  trustProxy: true
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: true, // Configure based on your needs
    credentials: true
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false // Disable CSP for API
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    global: true,
    max: config.security.rateLimit.max,
    timeWindow: config.security.rateLimit.timeWindow,
    errorResponseBuilder: function (request, context) {
      return {
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
        retryAfter: context.after
      };
    }
  });

  // Multipart support for file uploads
  await fastify.register(multipart, {
    limits: {
      fieldNameSize: 100,
      fieldSize: 100,
      fields: 10,
      fileSize: config.upload.maxFileSize,
      files: 1,
      headerPairs: 2000
    }
  });
}

// Register routes
async function registerRoutes() {
  // Health check (no auth required)
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.nodeEnv
    };
  });

  // API info (no auth required)
  fastify.get('/', async (request, reply) => {
    return {
      name: 'Image Converter API',
      version: '1.0.0',
      description: 'High-performance image conversion API with AVIF support',
      endpoints: [
        'POST /convert - Convert image to specified format',
        'POST /compress - Compress image with quality settings',
        'POST /resize - Resize image to specified dimensions',
        'POST /process - Process image with multiple operations',
        'POST /metadata - Get image metadata',
        'GET /health - Health check'
      ],
      authentication: 'X-API-Key header required for image endpoints',
      supportedFormats: ['avif', 'webp', 'jpeg', 'png'],
      maxFileSize: `${(config.upload.maxFileSize / 1024 / 1024).toFixed(2)} MB`
    };
  });

  // Register image routes with /api prefix
  await fastify.register(imageRoutes, { prefix: '/api' });
}

// Error handler
fastify.setErrorHandler(function (error, request, reply) {
  if (error.statusCode === 429) {
    return reply.status(429).send(error);
  }
  
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message
    });
  }

  if (error.statusCode >= 400 && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      error: error.name,
      message: error.message
    });
  }

  // Log server errors
  request.log.error(error);
  
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: config.server.nodeEnv === 'production' 
      ? 'An error occurred processing your request' 
      : error.message
  });
});

// Graceful shutdown
async function closeGracefully(signal) {
  console.log(`Received signal ${signal}, shutting down gracefully...`);
  await fastify.close();
  process.exit(0);
}

process.on('SIGINT', closeGracefully);
process.on('SIGTERM', closeGracefully);

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    
    await fastify.listen({
      port: config.server.port,
      host: config.server.host
    });
    
    console.log(`
🚀 Image Converter API is running!
📍 URL: http://${config.server.host}:${config.server.port}
🔐 API Keys configured: ${config.security.apiKeys.length}
📦 Max file size: ${(config.upload.maxFileSize / 1024 / 1024).toFixed(2)} MB
🎯 Environment: ${config.server.nodeEnv}
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();