import imageController from '../controllers/image.controller.js';
import { authenticateApiKey } from '../middleware/auth.js';

export default async function imageRoutes(fastify, options) {
  // Add authentication to all routes
  fastify.addHook('preHandler', authenticateApiKey);

  // Convert image to specified format
  fastify.post('/convert', {
    schema: {
      description: 'Convert image to specified format (AVIF, WebP, JPEG, PNG)',
      tags: ['Image Processing'],
      querystring: {
        type: 'object',
        properties: {
          format: { 
            type: 'string', 
            enum: ['avif', 'webp', 'jpeg', 'png'],
            default: 'avif',
            description: 'Output image format'
          },
          quality: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 100,
            description: 'Image quality (1-100)'
          },
          width: { 
            type: 'integer', 
            minimum: 1,
            description: 'Target width in pixels'
          },
          height: { 
            type: 'integer', 
            minimum: 1,
            description: 'Target height in pixels'
          },
          fit: { 
            type: 'string', 
            enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
            default: 'cover',
            description: 'How to fit the image'
          }
        }
      },
      response: {
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, imageController.convert.bind(imageController));

  // Compress image
  fastify.post('/compress', {
    schema: {
      description: 'Compress image with quality settings',
      tags: ['Image Processing'],
      querystring: {
        type: 'object',
        properties: {
          quality: { 
            type: 'integer', 
            minimum: 1, 
            maximum: 100,
            default: 80,
            description: 'Compression quality (1-100)'
          },
          format: { 
            type: 'string', 
            enum: ['avif', 'webp', 'jpeg', 'png'],
            description: 'Optional: convert to format while compressing'
          }
        }
      }
    }
  }, imageController.compress.bind(imageController));

  // Resize image
  fastify.post('/resize', {
    schema: {
      description: 'Resize image to specified dimensions',
      tags: ['Image Processing'],
      querystring: {
        type: 'object',
        properties: {
          width: { 
            type: 'integer', 
            minimum: 1,
            description: 'Target width in pixels'
          },
          height: { 
            type: 'integer', 
            minimum: 1,
            description: 'Target height in pixels'
          },
          fit: { 
            type: 'string', 
            enum: ['cover', 'contain', 'fill', 'inside', 'outside'],
            default: 'cover',
            description: 'How to fit the image'
          },
          position: { 
            type: 'string', 
            enum: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'center'],
            default: 'center',
            description: 'Position when fit is cover or contain'
          },
          format: { 
            type: 'string', 
            enum: ['avif', 'webp', 'jpeg', 'png'],
            description: 'Optional: output format'
          }
        }
      }
    }
  }, imageController.resize.bind(imageController));

  // Process image with multiple operations
  fastify.post('/process', {
    schema: {
      description: 'Process image with multiple operations (resize, convert, transform)',
      tags: ['Image Processing'],
      querystring: {
        type: 'object',
        properties: {
          // Resize options
          width: { type: 'integer', minimum: 1 },
          height: { type: 'integer', minimum: 1 },
          fit: { type: 'string', enum: ['cover', 'contain', 'fill', 'inside', 'outside'] },
          
          // Format options
          format: { type: 'string', enum: ['avif', 'webp', 'jpeg', 'png'], default: 'avif' },
          quality: { type: 'integer', minimum: 1, maximum: 100 },
          
          // Transform options
          rotate: { type: 'integer', enum: [0, 90, 180, 270] },
          flip: { type: 'boolean' },
          flop: { type: 'boolean' },
          grayscale: { type: 'boolean' },
          blur: { type: 'integer', minimum: 1, maximum: 100 },
          sharpen: { type: 'boolean' },
          normalize: { type: 'boolean' }
        }
      }
    }
  }, imageController.process.bind(imageController));

  // Get image metadata
  fastify.post('/metadata', {
    schema: {
      description: 'Get image metadata without processing',
      tags: ['Image Information'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            metadata: {
              type: 'object',
              properties: {
                format: { type: 'string' },
                width: { type: 'integer' },
                height: { type: 'integer' },
                space: { type: 'string' },
                channels: { type: 'integer' },
                depth: { type: 'string' },
                density: { type: 'integer' },
                hasProfile: { type: 'boolean' },
                hasAlpha: { type: 'boolean' },
                size: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, imageController.metadata.bind(imageController));
}