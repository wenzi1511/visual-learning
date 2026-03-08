const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const path = require('path');

describe('API Tests: History Loading', () => {

    const sectionsToTest = ['playground', 'architecture', 'eee', 'chemistry'];

    it('should retrieve a history list for visual learning sections', async () => {
        // Iterate over basic sections and test that they return 200 with an array
        for (const section of sectionsToTest) {
            const res = await request(app)
                .get(`/api/history?section=${section}`)
                .set('Accept', 'application/json');

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.history)).toBe(true);
        }
    });

    it('should return a 400 error if section parameter is missing', async () => {
        const res = await request(app)
            .get('/api/history')
            .set('Accept', 'application/json');

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Section required.');
    });

    it('should handle saving and deleting a test mock history entry', async () => {
        const mockData = {
            timestamp: Date.now(),
            name: "Jest Test Entry",
            data: "Test Configuration Data"
        };
        const section = 'playground';

        // 1. Save History
        let res = await request(app)
            .post('/api/history/save')
            .send({ section, data: mockData })
            .set('Accept', 'application/json');

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.path).toContain('history/playground/');

        const savedFilePath = res.body.path;

        // 2. Fetch History List again to make sure it includes our generated mock
        res = await request(app)
            .get(`/api/history?section=${section}`)
            .set('Accept', 'application/json');

        expect(res.statusCode).toEqual(200);
        expect(res.body.history.some(h => h.name === 'Jest Test Entry')).toBe(true);

        // 3. Delete History
        res = await request(app)
            .delete('/api/history')
            .send({ path: savedFilePath })
            .set('Accept', 'application/json');

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });

});
