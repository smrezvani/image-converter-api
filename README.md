# Image Converter API

A blazing-fast, high-performance image conversion API built with Fastify and Sharp, featuring full AVIF support and secure API key authentication.

## Features

- 🚀 **High Performance** - Built with Fastify for maximum throughput
- 🎨 **Multiple Formats** - Support for AVIF, WebP, JPEG, and PNG
- 🔒 **Secure** - API key authentication with rate limiting
- 📐 **Image Operations** - Convert, compress, resize, and transform images
- 🐳 **Docker Ready** - Includes Dockerfile and docker-compose for easy deployment
- ⚡ **Stream Processing** - Memory-efficient processing without temporary files
- 📊 **Metadata Support** - Extract image information without processing

## Quick Start

### Prerequisites

- Node.js 18+ (for local development)
- Docker & Docker Compose (for containerized deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd image-converter-api
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Using Docker

```bash
# Build image
docker build -t image-converter-api .

# Run container
docker run -d \
  -p 3000:3000 \
  -e API_KEYS=your-api-key \
  --name image-converter-api \
  image-converter-api
```

## API Documentation

### Authentication

All image processing endpoints require an `X-API-Key` header:

```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -F "file=@image.jpg" \
  http://localhost:3000/api/convert?format=avif
```

### Endpoints

#### POST /api/convert
Convert image to specified format.

**Query Parameters:**
- `format` - Output format (avif, webp, jpeg, png) - Default: avif
- `quality` - Quality (1-100)
- `width` - Target width in pixels
- `height` - Target height in pixels
- `fit` - How to fit (cover, contain, fill, inside, outside) - Default: cover

**Example:**
```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -F "file=@photo.jpg" \
  "http://localhost:3000/api/convert?format=avif&quality=60" \
  --output converted.avif
```

#### POST /api/compress
Compress image with quality settings.

**Query Parameters:**
- `quality` - Compression quality (1-100) - Default: 80
- `format` - Optional format conversion

**Example:**
```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -F "file=@large.png" \
  "http://localhost:3000/api/compress?quality=70" \
  --output compressed.png
```

#### POST /api/resize
Resize image to specified dimensions.

**Query Parameters:**
- `width` - Target width in pixels
- `height` - Target height in pixels
- `fit` - How to fit (cover, contain, fill, inside, outside) - Default: cover
- `position` - Position for cover/contain - Default: center
- `format` - Optional output format

**Example:**
```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -F "file=@photo.jpg" \
  "http://localhost:3000/api/resize?width=800&height=600" \
  --output resized.jpg
```

#### POST /api/process
Process image with multiple operations.

**Query Parameters:**
- All parameters from convert, compress, and resize
- `rotate` - Rotation angle (0, 90, 180, 270)
- `flip` - Flip vertically (true/false)
- `flop` - Flip horizontally (true/false)
- `grayscale` - Convert to grayscale (true/false)
- `blur` - Blur amount (1-100)
- `sharpen` - Sharpen image (true/false)
- `normalize` - Normalize image (true/false)

**Example:**
```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -F "file=@photo.jpg" \
  "http://localhost:3000/api/process?format=avif&width=800&rotate=90&grayscale=true" \
  --output processed.avif
```

#### POST /api/metadata
Get image metadata without processing.

**Example:**
```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -F "file=@photo.jpg" \
  http://localhost:3000/api/metadata
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "format": "jpeg",
    "width": 1920,
    "height": 1080,
    "space": "srgb",
    "channels": 3,
    "depth": "uchar",
    "density": 72,
    "hasProfile": false,
    "hasAlpha": false,
    "size": 245760
  }
}
```

#### GET /health
Health check endpoint (no authentication required).

```bash
curl http://localhost:3000/health
```

## Integration with n8n

To use this API in your n8n workflow:

1. Add an HTTP Request node
2. Configure:
   - **Method**: POST
   - **URL**: `http://your-server:3000/api/convert?format=avif&quality=60`
   - **Authentication**: Add Header
     - **Name**: `X-API-Key`
     - **Value**: Your API key
   - **Body Content Type**: Multipart Form Data
   - **Body Parameters**: 
     - **Parameter Type**: Form Binary Data
     - **Name**: `file`
     - **Input Data Field Name**: `data` (or your binary field name)

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `HOST` | Server host | 0.0.0.0 |
| `NODE_ENV` | Environment | development |
| `API_KEYS` | Comma-separated API keys | - |
| `RATE_LIMIT_MAX` | Max requests per window | 100 |
| `RATE_LIMIT_TIME_WINDOW` | Time window in ms | 60000 |
| `MAX_FILE_SIZE` | Max upload size in bytes | 10485760 |
| `AVIF_QUALITY` | Default AVIF quality | 60 |
| `WEBP_QUALITY` | Default WebP quality | 80 |
| `JPEG_QUALITY` | Default JPEG quality | 85 |
| `SHARP_CACHE` | Sharp cache size in MB | 100 |
| `SHARP_CONCURRENCY` | Sharp thread concurrency | 2 |
| `LOG_LEVEL` | Log level | info |

## Performance Tips

1. **Use AVIF for best compression** - Typically 50% smaller than JPEG
2. **Set appropriate quality levels** - 60-70 for AVIF, 80-85 for WebP/JPEG
3. **Resize images** - Reduce dimensions for web use
4. **Enable caching** - Use CDN or reverse proxy for converted images
5. **Monitor memory** - Adjust `SHARP_CACHE` and `SHARP_CONCURRENCY` based on available resources

## Response Headers

The API returns useful headers with each processed image:

- `Content-Type` - MIME type of the output image
- `Content-Length` - Size of the output image
- `X-Original-Size` - Original file size
- `X-Compression-Ratio` - Compression percentage achieved
- `X-Image-Format` - Output image format
- `X-Image-Width` - Output image width
- `X-Image-Height` - Output image height

## Security

- API key authentication required for all image endpoints
- Rate limiting to prevent abuse
- File size limits to prevent memory exhaustion
- Input validation and sanitization
- Secure headers with Helmet.js

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Build Docker image
docker build -t image-converter-api .
```

## Production Deployment

### Recommended Setup

1. Use Docker for consistent deployment
2. Place behind a reverse proxy (nginx/traefik)
3. Enable SSL/TLS
4. Use environment variables for configuration
5. Monitor logs and metrics
6. Set up health checks
7. Configure backup and recovery

### Example nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### AVIF Support Issues

If AVIF conversion fails, ensure your system has proper support:

```bash
# Check Sharp AVIF support
node -e "console.log(require('sharp').format.avif)"

# Install system dependencies (Ubuntu/Debian)
apt-get install libvips-dev libheif-dev

# Install system dependencies (Alpine)
apk add vips-dev vips-heif
```

### Memory Issues

If experiencing memory issues:

1. Reduce `SHARP_CONCURRENCY`
2. Lower `SHARP_CACHE` value
3. Decrease `MAX_FILE_SIZE`
4. Increase Docker memory limits

## License

MIT

## Support

For issues and questions, please open an issue in the repository.