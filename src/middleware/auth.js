import config from '../config/index.js';

export async function authenticateApiKey(request, reply) {
  const apiKey = request.headers['x-api-key'];
  
  if (!apiKey) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing X-API-Key header'
    });
  }
  
  if (!config.security.apiKeys.includes(apiKey)) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }
}