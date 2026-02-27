const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const Groq = require('groq-sdk');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the project root
app.use(express.static(path.join(__dirname)));

app.post('/api/generate', async (req, res) => {
    try {
        const { apiKey, problemDescription, platform = 'gemini', section = 'playground' } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required.' });
        }
        if (!problemDescription) {
            return res.status(400).json({ error: 'Problem description is required.' });
        }

        const selectedModel = req.body.model || 'gemini-2.5-pro';

        const promptPath = path.join(__dirname, section, 'prompt.txt');
        const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

        let textResponse = '';
        if (platform === 'groq') {
            const groq = new Groq({ apiKey: apiKey });
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `USER PROBLEM DESCRIPTION:\n${problemDescription}`
                    }
                ],
                model: selectedModel,
                temperature: 0.1,
                response_format: { type: "json_object" },
            });
            textResponse = completion.choices[0]?.message?.content || '{}';
        } else {
            const combinedPrompt = `${systemPrompt}\n\nUSER PROBLEM DESCRIPTION:\n${problemDescription}`;
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: combinedPrompt,
            });
            textResponse = response.text;
        }

        // Try to extract JSON from markdown if it's wrapped in triple backticks
        let jsonStr = textResponse;
        const jsonMatch = textResponse.match(/```(?:json)?([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        // Validate that it's parseable JSON
        const parsedJson = JSON.parse(jsonStr);

        // Save History
        const historyDir = path.join(__dirname, 'history', section);
        if (!fs.existsSync(historyDir)) {
            fs.mkdirSync(historyDir, { recursive: true });
        }

        const timestamp = Date.now();
        const historyFilename = `${timestamp}.json`;
        const historyPath = path.join(historyDir, historyFilename);

        fs.writeFileSync(historyPath, JSON.stringify(parsedJson, null, 2), 'utf-8');

        // Return the relative path to the new history file
        res.json({
            success: true,
            message: 'Visual generated and saved to history successfully.',
            historyPath: `history/${section}/${historyFilename}`
        });
    } catch (error) {
        console.error('Error generating AI content:', error);
        res.status(500).json({ error: error.message || 'Failed to generate visual.' });
    }
});

app.post('/api/models', async (req, res) => {
    try {
        const { apiKey, platform = 'gemini' } = req.body;
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required.' });
        }

        let availableModels = [];

        if (platform === 'groq') {
            const groq = new Groq({ apiKey: apiKey });
            const response = await groq.models.list();
            for (const model of response.data) {
                // Return displayable name
                availableModels.push({
                    name: model.id,
                    displayName: model.id
                });
            }
        } else {
            const ai = new GoogleGenAI({ apiKey: apiKey });

            // Fetch models using the new SDK
            const response = await ai.models.list();

            // Filter to include only models that support content generation
            for await (const model of response) {
                if (model.supportedActions && model.supportedActions.includes('generateContent')) {
                    // Return the displayable name and the actual model payload id
                    availableModels.push({
                        name: model.name,
                        displayName: model.displayName || model.name
                    });
                }
            }
        }

        // Fallback or additional filtering if required
        res.json({ success: true, models: availableModels });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch models.' });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        const { section } = req.query;
        if (!section) {
            return res.status(400).json({ error: 'Section query parameter is required.' });
        }

        const historyDir = path.join(__dirname, 'history', section);
        const historyFiles = [];

        if (fs.existsSync(historyDir)) {
            const files = fs.readdirSync(historyDir);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(historyDir, file);
                    try {
                        const fileContent = fs.readFileSync(filePath, 'utf-8');
                        const jsonData = JSON.parse(fileContent);

                        historyFiles.push({
                            filename: file,
                            path: `history/${section}/${file}`,
                            name: jsonData.name || 'Untitled Generation',
                            difficulty: jsonData.difficulty || 'Unknown',
                            timestamp: parseInt(file.replace('.json', ''), 10)
                        });
                    } catch (e) {
                        console.error(`Error parsing history file ${file}:`, e);
                    }
                }
            }
        }

        // Sort new to old
        historyFiles.sort((a, b) => b.timestamp - a.timestamp);

        res.json({ success: true, history: historyFiles });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch history.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
    console.log(`Playground available at http://localhost:${PORT}/playground/test.html`);
});
