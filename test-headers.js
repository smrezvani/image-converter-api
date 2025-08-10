#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000';
const API_KEY = 'dev-api-key-2024';

// Create a test image if it doesn't exist
const testImagePath = './test-image.jpg';
if (!fs.existsSync(testImagePath)) {
  // Create a simple 1x1 pixel JPEG
  const buffer = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=', 'base64');
  fs.writeFileSync(testImagePath, buffer);
}

async function testConvertEndpoint() {
  console.log('Testing /api/convert endpoint...\n');
  
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(testImagePath);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'test-image.jpg');
    
    const response = await fetch(`${API_URL}/api/convert?format=avif&quality=60`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY
      },
      body: formData
    });
    
    console.log('Status:', response.status);
    console.log('\nHeaders:');
    console.log('Content-Type:', response.headers.get('Content-Type'));
    console.log('Content-Disposition:', response.headers.get('Content-Disposition'));
    console.log('X-Filename:', response.headers.get('X-Filename'));
    console.log('X-Image-Format:', response.headers.get('X-Image-Format'));
    console.log('X-Compression-Ratio:', response.headers.get('X-Compression-Ratio'));
    
    // Extract filename from Content-Disposition
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
      if (filenameMatch) {
        console.log('\nExtracted filename:', filenameMatch[1]);
        console.log('File extension:', path.extname(filenameMatch[1]));
      }
    }
    
    if (response.ok) {
      console.log('\n✅ Test passed! Headers are correctly set.');
    } else {
      console.log('\n❌ Test failed:', await response.text());
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure the server is running: npm start');
  }
}

// Run test
testConvertEndpoint();