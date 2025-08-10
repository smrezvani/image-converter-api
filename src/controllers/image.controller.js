import imageService from '../services/image.service.js';

export class ImageController {
  /**
   * Convert image to specified format
   */
  async convert(request, reply) {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      const buffer = await data.toBuffer();
      
      // Validate image
      const validation = await imageService.validateImage(buffer);
      if (!validation.valid) {
        return reply.code(400).send({
          error: 'Invalid Image',
          message: validation.error
        });
      }

      // Get conversion options from query params
      const options = {
        format: request.query.format || 'avif',
        quality: request.query.quality ? parseInt(request.query.quality) : undefined,
        width: request.query.width ? parseInt(request.query.width) : undefined,
        height: request.query.height ? parseInt(request.query.height) : undefined,
        fit: request.query.fit || 'cover'
      };

      const result = await imageService.convert(buffer, options);
      
      // Set appropriate content type
      const contentType = this.getContentType(result.format);
      
      return reply
        .code(200)
        .header('Content-Type', contentType)
        .header('Content-Length', result.size)
        .header('X-Original-Size', validation.size)
        .header('X-Compression-Ratio', `${result.compressionRatio}%`)
        .header('X-Image-Format', result.format)
        .header('X-Image-Width', result.metadata.width)
        .header('X-Image-Height', result.metadata.height)
        .send(result.data);
        
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Compress image
   */
  async compress(request, reply) {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      const buffer = await data.toBuffer();
      
      // Validate image
      const validation = await imageService.validateImage(buffer);
      if (!validation.valid) {
        return reply.code(400).send({
          error: 'Invalid Image',
          message: validation.error
        });
      }

      const options = {
        quality: request.query.quality ? parseInt(request.query.quality) : 80,
        format: request.query.format // Optional, maintains original if not specified
      };

      const result = await imageService.compress(buffer, options);
      
      const contentType = this.getContentType(result.format);
      
      return reply
        .code(200)
        .header('Content-Type', contentType)
        .header('Content-Length', result.size)
        .header('X-Original-Size', validation.size)
        .header('X-Compression-Ratio', `${result.compressionRatio}%`)
        .send(result.data);
        
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Resize image
   */
  async resize(request, reply) {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      const buffer = await data.toBuffer();
      
      // Validate image
      const validation = await imageService.validateImage(buffer);
      if (!validation.valid) {
        return reply.code(400).send({
          error: 'Invalid Image',
          message: validation.error
        });
      }

      const options = {
        width: request.query.width ? parseInt(request.query.width) : undefined,
        height: request.query.height ? parseInt(request.query.height) : undefined,
        fit: request.query.fit || 'cover',
        position: request.query.position || 'center',
        format: request.query.format
      };

      if (!options.width && !options.height) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Width or height must be specified'
        });
      }

      const result = await imageService.resize(buffer, options);
      
      const contentType = this.getContentType(result.metadata.format);
      
      return reply
        .code(200)
        .header('Content-Type', contentType)
        .header('Content-Length', result.size)
        .header('X-Original-Size', validation.size)
        .header('X-Image-Width', result.metadata.width)
        .header('X-Image-Height', result.metadata.height)
        .send(result.data);
        
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Process image with multiple operations
   */
  async process(request, reply) {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      const buffer = await data.toBuffer();
      
      // Validate image
      const validation = await imageService.validateImage(buffer);
      if (!validation.valid) {
        return reply.code(400).send({
          error: 'Invalid Image',
          message: validation.error
        });
      }

      // Parse operations from request body or query
      const operations = {
        resize: {
          width: request.query.width ? parseInt(request.query.width) : undefined,
          height: request.query.height ? parseInt(request.query.height) : undefined,
          fit: request.query.fit
        },
        convert: {
          format: request.query.format || 'avif',
          quality: request.query.quality ? parseInt(request.query.quality) : undefined
        },
        rotate: request.query.rotate ? parseInt(request.query.rotate) : undefined,
        flip: request.query.flip === 'true',
        flop: request.query.flop === 'true',
        grayscale: request.query.grayscale === 'true',
        blur: request.query.blur,
        sharpen: request.query.sharpen === 'true',
        normalize: request.query.normalize === 'true'
      };

      const result = await imageService.process(buffer, operations);
      
      const contentType = this.getContentType(result.format);
      
      return reply
        .code(200)
        .header('Content-Type', contentType)
        .header('Content-Length', result.size)
        .header('X-Original-Size', validation.size)
        .header('X-Compression-Ratio', `${result.compressionRatio}%`)
        .header('X-Image-Format', result.format)
        .header('X-Image-Width', result.metadata.width)
        .header('X-Image-Height', result.metadata.height)
        .send(result.data);
        
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Get image metadata
   */
  async metadata(request, reply) {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      const buffer = await data.toBuffer();
      const metadata = await imageService.getMetadata(buffer);
      
      return reply.code(200).send({
        success: true,
        metadata: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          space: metadata.space,
          channels: metadata.channels,
          depth: metadata.depth,
          density: metadata.density,
          hasProfile: metadata.hasProfile,
          hasAlpha: metadata.hasAlpha,
          size: buffer.length
        }
      });
      
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  /**
   * Helper to get content type from format
   */
  getContentType(format) {
    const mimeTypes = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      tiff: 'image/tiff',
      gif: 'image/gif'
    };
    
    return mimeTypes[format] || 'application/octet-stream';
  }
}

export default new ImageController();