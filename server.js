const express = require('express');
const { GoogleGenAI } = require('@google/genai'); // Correct new SDK class
const Groq = require('groq-sdk');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

/* ============================================================
   GENERATE ENDPOINT
============================================================ */
app.post('/api/generate', async (req, res) => {
    try {
        const {
            apiKey,
            problemDescription,
            platform = 'gemini',
            section = 'playground',
            conversationHistory = [],
            visualHistory = [],
            chatId
        } = req.body;

        if (!apiKey) return res.status(400).json({ error: 'API key is required.' });
        if (!problemDescription) return res.status(400).json({ error: 'Problem description is required.' });

        const selectedModel = req.body.model || 'gemini-2.5-flash';
        const promptPath = path.join(__dirname, section, 'prompt.txt');
        const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

        let textResponse = '';

        /* --- GROQ LOGIC --- */
        if (platform === 'groq') {
            const groq = new Groq({ apiKey });
            const messages = [{ role: "system", content: systemPrompt }];
            const recentHistory = conversationHistory.slice(-20);

            for (const msg of recentHistory) {
                messages.push({
                    role: msg.role,
                    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                });
            }

            messages.push({
                role: "user",
                content: `USER PROBLEM DESCRIPTION:\n${problemDescription}`
            });

            const completion = await groq.chat.completions.create({
                messages,
                model: selectedModel,
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            textResponse = completion.choices[0]?.message?.content || '{}';
        }

        /* --- GEMINI LOGIC --- */
        else {
            let combinedPrompt = systemPrompt;
            const recentHistory = conversationHistory.slice(-20);

            if (recentHistory.length > 0) {
                combinedPrompt += '\n\n--- CONVERSATION HISTORY ---\n';
                for (const msg of recentHistory) {
                    const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
                    combinedPrompt += `${role}: ${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}\n\n`;
                }
                combinedPrompt += '--- END CONVERSATION HISTORY ---\n';
            }

            combinedPrompt += `\n\nUSER PROBLEM DESCRIPTION:\n${problemDescription}`;

            const ai = new GoogleGenAI({ apiKey });

            const aiCall = ai.models.generateContent({
                model: selectedModel,
                contents: combinedPrompt, // The new SDK accepts strings directly here
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            });

            // 90s hard timeout for AI generation
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error("AI generation timed out after 90 seconds. Try a simpler prompt or a different model.")), 90000);
            });

            const response = await Promise.race([aiCall, timeoutPromise]).finally(() => {
                clearTimeout(timeoutId);
                aiCall.catch(() => { }); // prevent unhandled rejection 
            });
            textResponse = response.text || '{}';
        }

        /* --- JSON EXTRACTION --- */
        let jsonStr = textResponse;
        const jsonMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1].trim();

        let parsedJson;
        try {
            parsedJson = JSON.parse(jsonStr);
        } catch (err) {
            parsedJson = eval('(' + jsonStr + ')');
        }

        /* --- SAVE HISTORY --- */
        const historyDir = path.join(__dirname, 'history', section);
        if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

        const currentChatId = chatId || Date.now().toString();
        const historyPath = path.join(historyDir, `${currentChatId}.json`);
        const nonThreadedSections = ['playground', 'architecture', 'charts', 'science', 'eee', 'chemistry'];

        let contentToSave;
        if (nonThreadedSections.includes(section)) {
            contentToSave = parsedJson;
        } else {
            const newConvoHistory = [...conversationHistory, { role: 'assistant', fullResponse: parsedJson }];
            const newVisualHistory = [...visualHistory];

            if (parsedJson.visualType && parsedJson.visualCode) {
                newVisualHistory.push({
                    type: parsedJson.visualType,
                    code: parsedJson.visualCode,
                    name: parsedJson.name || 'Visual'
                });
            }

            contentToSave = {
                chatId: currentChatId,
                name: parsedJson.name || 'Untitled Generation',
                difficulty: parsedJson.difficulty || 'Unknown',
                timestamp: parseInt(currentChatId, 10) || Date.now(),
                conversationHistory: newConvoHistory,
                visualHistory: newVisualHistory
            };
        }

        fs.writeFileSync(historyPath, JSON.stringify(contentToSave, null, 2));

        res.json({
            success: true,
            message: 'Visual generated and saved successfully.',
            chatId: currentChatId,
            generatedResponse: parsedJson,
            historyPath: `history/${section}/${currentChatId}.json`
        });

    } catch (error) {
        console.error('Error generating AI content:', error);
        res.status(500).json({ error: error.message || 'Failed to generate visual.' });
    }
});


/* ============================================================
   MODEL LIST ENDPOINT
============================================================ */
app.post('/api/models', async (req, res) => {
    try {
        const { apiKey, platform = 'gemini' } = req.body;
        if (!apiKey) return res.status(400).json({ error: 'API key is required.' });

        let availableModels = [];

        if (platform === 'groq') {
            const groq = new Groq({ apiKey });
            const response = await groq.models.list();
            const models = response.data || [];

            for (const model of models) {
                availableModels.push({ name: model.id, displayName: model.id });
            }
        }
        else {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.list();

            // Handle new SDK's AsyncIterable behavior seamlessly
            const iterable = response.models || response.data || response;

            for await (const model of iterable) {
                const name = (model.name || model.id || '').replace(/^models\//, '');
                const displayName = model.displayName || model.display_name || name;

                // Checking for capabilities in the new SDK structure
                const rawCaps =
                    model.supportedGenerationMethods ||
                    model.supportedActions ||
                    model.supported_actions ||
                    model.capabilities ||
                    [];

                const caps = Array.isArray(rawCaps) ? rawCaps.map(c => String(c)) : [String(rawCaps)];
                const supportsGenerate = caps.some(c => c.toLowerCase().includes('generate'));

                if (supportsGenerate || name.toLowerCase().includes('gemini')) {
                    availableModels.push({ name, displayName });
                }
            }
        }

        res.json({ success: true, models: availableModels });

    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch models.' });
    }
});


/* ============================================================
   SAVE HISTORY (for sections that call AI directly)
============================================================ */
app.post('/api/history/save', (req, res) => {
    try {
        const { section, data } = req.body;
        if (!section || !data) return res.status(400).json({ error: 'Section and data required.' });

        const historyDir = path.join(__dirname, 'history', section);
        if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

        const chatId = (data.timestamp || Date.now()).toString();
        const historyPath = path.join(historyDir, `${chatId}.json`);

        fs.writeFileSync(historyPath, JSON.stringify(data, null, 2));
        res.json({ success: true, path: `history/${section}/${chatId}.json` });
    } catch (error) {
        console.error('Error saving history:', error);
        res.status(500).json({ error: error.message || 'Failed to save history.' });
    }
});


/* ============================================================
   HISTORY LIST
============================================================ */
app.get('/api/history', async (req, res) => {
    try {
        const { section } = req.query;
        if (!section) return res.status(400).json({ error: 'Section required.' });

        const historyDir = path.join(__dirname, 'history', section);
        let historyFiles = [];

        if (fs.existsSync(historyDir)) {
            const files = fs.readdirSync(historyDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                try {
                    const content = JSON.parse(fs.readFileSync(path.join(historyDir, file), 'utf-8'));
                    historyFiles.push({
                        filename: file,
                        path: `history/${section}/${file}`,
                        name: content.name || content.title || 'Untitled',
                        difficulty: content.difficulty || 'Unknown',
                        timestamp: parseInt(file.replace('.json', ''), 10) || Date.now()
                    });
                } catch (e) {
                    console.error(`Error parsing ${file}:`, e);
                }
            }
        }

        historyFiles.sort((a, b) => b.timestamp - a.timestamp);
        res.json({ success: true, history: historyFiles });

    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch history.' });
    }
});


/* ============================================================
   DELETE HISTORY
============================================================ */
app.delete('/api/history', (req, res) => {
    try {
        const { path: filePath } = req.body;
        if (!filePath || !filePath.startsWith('history/')) return res.status(400).json({ error: 'Invalid path.' });

        const absolutePath = path.join(__dirname, filePath);
        if (!absolutePath.startsWith(path.join(__dirname, 'history'))) {
            return res.status(400).json({ error: 'Path traversal detected.' });
        }

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            return res.json({ success: true });
        }

        res.status(404).json({ error: 'File not found.' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message || 'Delete failed.' });
    }
});


/* ============================================================
   RENDER ENDPOINT
============================================================ */
app.post('/api/render', (req, res) => {
    let texCode = req.body.code || '';

    // Auto-wrap if documentclass is missing
    let isTikz = texCode.includes('circuitikz') || texCode.includes('tikzpicture');
    let isChem = texCode.includes('chemfig');

    // Use TikZ standalone class for flawless bounding box tracing on PGF paths for both Chemistry & EEE
    let docClass = '\\documentclass[tikz,border=5mm]{standalone}';

    if (!texCode.includes('\\documentclass')) {
        let wrappedCode = `${docClass}\n`;
        if (isTikz) wrappedCode += `\\usepackage{circuitikz}\n`;
        if (isChem) wrappedCode += `\\usepackage{chemfig}\n`;
        wrappedCode += `\\begin{document}\n`;
        wrappedCode += texCode + `\n`;
        wrappedCode += `\\end{document}`;
        texCode = wrappedCode;
    } else {
        // Force standalone document class with tight borders, respecting tikz necessity
        texCode = texCode.replace(/\\documentclass(\s*\[.*?\]\s*)?\{.*?\}/, docClass);
    }



    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const texFile = path.join(tempDir, 'circuit.tex');
    const dviFile = path.join(tempDir, 'circuit.dvi');
    const svgFile = path.join(tempDir, 'circuit.svg');

    fs.writeFileSync(texFile, texCode);

    try {
        // Compile directly to DVI to support automatic exact bounding-box cropping with dvisvgm
        execSync(`latex -interaction=nonstopmode -halt-on-error circuit.tex`, { cwd: tempDir, stdio: 'ignore', timeout: 10000 });

        // Convert the resulting DVI to SVG
        execSync(`dvisvgm --no-fonts -o circuit.svg circuit.dvi`, { cwd: tempDir, stdio: 'ignore', timeout: 10000 });

        if (fs.existsSync(svgFile)) {
            res.type('svg').send(fs.readFileSync(svgFile, 'utf8'));
        } else {
            res.status(500).send('SVG generation failed.');
        }
    } catch (error) {
        res.status(500).send('Compilation failed. Check LaTeX syntax.');
    }
});


/* ============================================================
   START SERVER
============================================================ */
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));