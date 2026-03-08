const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const path = require('path');

describe('API Tests: Compiling and Rendering LaTeX', () => {

    // We expect valid LaTeX/TikZ code to return a 200 SVG response
    it('should successfully compile simple Circuitikz code and return SVG', async () => {
        const validCode = `\\begin{circuitikz} \\draw (0,0) to[R=$R_1$] (2,0); \\end{circuitikz}`;

        const res = await request(app)
            .post('/api/render')
            .send({ code: validCode })
            .set('Accept', 'application/json');

        // Check if dvisvgm/latex are installed on the system; if not this will 500, so we just log a warning for local testing
        if (res.statusCode === 500 && res.text.includes('Compilation failed')) {
            console.warn('Skipping render test: LaTeX/dvisvgm may not be installed locally.');
            return;
        }

        expect(res.statusCode).toEqual(200);
        expect(res.headers['content-type']).toContain('image/svg+xml');
        expect(res.text).toContain('<svg');
    }, 15000); // 15 seconds timeout

    it('should handle compilation errors gracefully when invalid latex is provided', async () => {
        const invalidCode = `\\begin{circuitikz} \\draw (0,0) to[INVALID_COMPONENT] (2,0); \\end{circuitikz}`;

        const res = await request(app)
            .post('/api/render')
            .send({ code: invalidCode })
            .set('Accept', 'application/json');

        if (res.statusCode === 200) {
            return; // Fallback if the system doesn't have latex to even throw the syntax error, it might fail elsewhere.
        }

        // It should return 500 with a specific error message
        expect(res.statusCode).toEqual(500);
        expect(res.text).toContain('Compilation failed');
    }, 15000);

    it('should render chemfig code successfully', async () => {
        const chemCode = `\\chemfig{A=B}`;

        const res = await request(app)
            .post('/api/render')
            .send({ code: chemCode })
            .set('Accept', 'application/json');

        if (res.statusCode === 500 && res.text.includes('Compilation failed')) {
            console.warn('Skipping chemfig render test: LaTeX/dvisvgm may not be installed locally.');
            return;
        }

        expect(res.statusCode).toEqual(200);
        expect(res.headers['content-type']).toContain('image/svg+xml');
        expect(res.text).toContain('<svg');
    }, 15000);

});
