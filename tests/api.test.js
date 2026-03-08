const request = require('supertest');
const express = require('express');
const path = require('path');

// We need to load server.js and its logic without it starting the server locally to prevent port collisions
// Best way to test Express apps is exporting the `app` instance.
// For now, let's assume `app` is exported in server.js or we duplicate the minimal setup
// The user already has server.js, we will just require it and test against the running instance or mocked one.

const app = require('../server'); // Assuming we can export app from server.js

describe('API Tests: Listing Models', () => {

    it('should list Gemini models when GEMINI_API_KEY is present', async () => {
        // Skip if key doesn't exist to prevent failing test on local machines without keys
        if (!process.env.GEMINI_API_KEY) {
            console.log('Skipping Gemini test: No GEMINI_API_KEY set in .env');
            return;
        }

        const res = await request(app)
            .post('/api/models')
            .send({ platform: 'gemini' })
            .set('Accept', 'application/json');

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.models)).toBe(true);
        expect(res.body.models.length).toBeGreaterThan(0);

        // Ensure standard model properties
        expect(res.body.models[0]).toHaveProperty('name');
        expect(res.body.models[0]).toHaveProperty('displayName');
    });

    it('should list Groq models when GROQ_API_KEY is present', async () => {
        // Skip if key doesn't exist
        if (!process.env.GROQ_API_KEY) {
            console.log('Skipping Groq test: No GROQ_API_KEY set in .env');
            return;
        }

        const res = await request(app)
            .post('/api/models')
            .send({ platform: 'groq' })
            .set('Accept', 'application/json');

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.models)).toBe(true);
        expect(res.body.models.length).toBeGreaterThan(0);

        // Ensure standard model properties
        expect(res.body.models[0]).toHaveProperty('name');
        expect(res.body.models[0]).toHaveProperty('displayName');
    });

    it('should return 400 error if API key is not present', async () => {
        // Test edge case where key might be missing entirely in the mocked request
        const res = await request(app)
            .post('/api/models')
            .send({ platform: 'unknown_platform_no_key' })
            .set('Accept', 'application/json');

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('API key is required.');
    });

});
