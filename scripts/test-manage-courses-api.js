#!/usr/bin/env node
/**
 * Test script for Manage Courses API endpoints.
 * Run: node scripts/test-manage-courses-api.js
 * 
 * Prerequisites:
 * 1. Server must be running (npm start)
 * 2. .env must have valid DB connection and JWT_SECRET
 * 3. You need a valid auth token - log in via the app, then pass token as:
 *    TOKEN=xxx node scripts/test-manage-courses-api.js
 */

require('dotenv').config();
const BASE = process.env.API_BASE || 'http://localhost:3000';
const TOKEN = process.env.TOKEN || '';

async function test(name, fn) {
  try {
    await fn();
    console.log('✓', name);
  } catch (err) {
    console.error('✗', name);
    console.error('  ', err.message);
  }
}

async function main() {
  console.log('Testing Manage Courses API endpoints');
  console.log('Base URL:', BASE);
  console.log('');

  await test('Health check', async () => {
    const res = await fetch(`${BASE}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  if (!TOKEN) {
    console.log('\nNo TOKEN set. Skipping authenticated endpoints.');
    console.log('To test: Log in via the app, get token from localStorage, then run:');
    console.log('  TOKEN=your_jwt_token node scripts/test-manage-courses-api.js');
    return;
  }

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  await test('GET /api/courses/by-category/2025-2026', async () => {
    const res = await fetch(`${BASE}/api/courses/by-category/2025-2026`, { headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (typeof data !== 'object') throw new Error('Expected object');
  });

  await test('GET /api/student-registration/students?admission_number=5', async () => {
    const res = await fetch(
      `${BASE}/api/student-registration/students?admission_number=5`,
      { headers }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Expected array');
  });

  console.log('\nDone.');
}

main().catch(console.error);
