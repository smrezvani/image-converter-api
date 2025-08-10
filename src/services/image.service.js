import sharp from 'sharp';
import config from '../config/index.js';

// Configure Sharp
sharp.cache(config.sharp.cache);
sharp.concurrency(config.sharp.concurrency);

export class ImageService {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'tiff', 'gif'];
    this.supportedOutputFormats = ['jpeg', 'png', 'webp', 'avif'];
  }

  /**
   * Convert image to specified format
   */
  async convert(buffer, options = {}) {
    const {
      format = 'avif',
      quality = config.imageProcessing.defaultQuality,
      width,
      height,
      fit = 'cover',
      withoutEnlargement = true
    } = options;

    if (!this.supportedOutputFormats.includes(format)) {
      throw new Error(`Unsupported output format: ${format}`);
    }

    let pipeline = sharp(buffer);

    // Get metadata for validation
    const metadata = await pipeline.metadata();
    
    // Apply resizing if specified
    if (width || height) {
      pipeline = pipeline.resize({
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        fit,
        withoutEnlargement
      });
    }

    // Apply format-specific settings
    const formatConfig = config.imageProcessing.formats[format] || {};
    const finalQuality = quality || formatConfig.quality || config.imageProcessing.defaultQuality;

    switch (format) {
      case 'avif':
        pipeline = pipeline.avif({
          quality: finalQuality,
          effort: formatConfig.effort || 4,
          chromaSubsampling: formatConfig.chromaSubsampling || '4:2:0'
        });
        break;
      
      case 'webp':
        pipeline = pipeline.webp({
          quality: finalQuality,
          effort: formatConfig.effort || 4,
          smartSubsample: formatConfig.smartSubsample !== false
        });
        break;
      
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality: finalQuality,
          progressive: formatConfig.progressive !== false,
          mozjpeg: formatConfig.mozjpeg !== false
        });
        break;
      
      case 'png':
        pipeline = pipeline.png({
          compressionLevel: formatConfig.compressionLevel || 9,
          progressive: formatConfig.progressive !== false
        });
        break;
    }

    const result = await pipeline.toBuffer();
    
    return {
      data: result,
      format,
      size: result.length,
      originalSize: buffer.length,
      compressionRatio: ((1 - result.length / buffer.length) * 100).toFixed(2),
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        originalFormat: metadata.format
      }
    };
  }

  /**
   * Compress image with quality settings
   */
  async compress(buffer, options = {}) {
    const metadata = await sharp(buffer).metadata();
    const currentFormat = metadata.format;
    
    return this.convert(buffer, {
      ...options,
      format: options.format || currentFormat
    });
  }

  /**
   * Resize image
   */
  async resize(buffer, options = {}) {
    const {
      width,
      height,
      fit = 'cover',
      position = 'center',
      background = { r: 255, g: 255, b: 255, alpha: 0 }
    } = options;

    if (!width && !height) {
      throw new Error('Width or height must be specified for resize');
    }

    const pipeline = sharp(buffer)
      .resize({
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        fit,
        position,
        background
      });

    const metadata = await sharp(buffer).metadata();
    const format = options.format || metadata.format;
    
    // Maintain format
    switch (format) {
      case 'jpeg':
      case 'jpg':
        pipeline.jpeg(config.imageProcessing.formats.jpeg);
        break;
      case 'png':
        pipeline.png(config.imageProcessing.formats.png);
        break;
      case 'webp':
        pipeline.webp(config.imageProcessing.formats.webp);
        break;
      case 'avif':
        pipeline.avif(config.imageProcessing.formats.avif);
        break;
    }

    const result = await pipeline.toBuffer();
    
    return {
      data: result,
      size: result.length,
      originalSize: buffer.length,
      metadata: await sharp(result).metadata()
    };
  }

  /**
   * Process image with multiple operations
   */
  async process(buffer, operations = {}) {
    const {
      resize: resizeOpts,
      convert: convertOpts,
      rotate,
      flip,
      flop,
      grayscale,
      blur,
      sharpen,
      normalize
    } = operations;

    let pipeline = sharp(buffer);

    // Apply transformations
    if (rotate) pipeline = pipeline.rotate(parseInt(rotate));
    if (flip) pipeline = pipeline.flip();
    if (flop) pipeline = pipeline.flop();
    if (grayscale) pipeline = pipeline.grayscale();
    if (blur) pipeline = pipeline.blur(blur === true ? 3 : parseInt(blur));
    if (sharpen) pipeline = pipeline.sharpen();
    if (normalize) pipeline = pipeline.normalize();

    // Apply resize
    if (resizeOpts) {
      const { width, height, fit = 'cover' } = resizeOpts;
      if (width || height) {
        pipeline = pipeline.resize({
          width: width ? parseInt(width) : undefined,
          height: height ? parseInt(height) : undefined,
          fit,
          withoutEnlargement: true
        });
      }
    }

    // Apply format conversion
    const format = convertOpts?.format || 'avif';
    const quality = convertOpts?.quality || config.imageProcessing.formats[format]?.quality;
    
    switch (format) {
      case 'avif':
        pipeline = pipeline.avif({
          quality,
          ...config.imageProcessing.formats.avif
        });
        break;
      case 'webp':
        pipeline = pipeline.webp({
          quality,
          ...config.imageProcessing.formats.webp
        });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality,
          ...config.imageProcessing.formats.jpeg
        });
        break;
      case 'png':
        pipeline = pipeline.png(config.imageProcessing.formats.png);
        break;
    }

    const result = await pipeline.toBuffer();
    const metadata = await sharp(result).metadata();
    
    return {
      data: result,
      format,
      size: result.length,
      originalSize: buffer.length,
      compressionRatio: ((1 - result.length / buffer.length) * 100).toFixed(2),
      metadata
    };
  }

  /**
   * Get image metadata
   */
  async getMetadata(buffer) {
    return await sharp(buffer).metadata();
  }

  /**
   * Validate image buffer
   */
  async validateImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        valid: true,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: buffer.length
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

export default new ImageService();