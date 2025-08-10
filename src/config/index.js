import dotenv from 'dotenv';
dotenv.config();

export default {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  security: {
    apiKeys: (process.env.API_KEYS || '').split(',').filter(Boolean),
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000', 10)
    }
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10) // 10MB default
  },
  
  imageProcessing: {
    defaultQuality: parseInt(process.env.DEFAULT_QUALITY || '80', 10),
    formats: {
      avif: {
        quality: parseInt(process.env.AVIF_QUALITY || '60', 10),
        effort: 4,
        chromaSubsampling: '4:2:0'
      },
      webp: {
        quality: parseInt(process.env.WEBP_QUALITY || '80', 10),
        effort: 4,
        smartSubsample: true
      },
      jpeg: {
        quality: parseInt(process.env.JPEG_QUALITY || '85', 10),
        progressive: true,
        mozjpeg: true
      },
      png: {
        compressionLevel: 9,
        progressive: true
      }
    }
  },
  
  sharp: {
    cache: parseInt(process.env.SHARP_CACHE || '100', 10),
    concurrency: parseInt(process.env.SHARP_CONCURRENCY || '2', 10)
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};