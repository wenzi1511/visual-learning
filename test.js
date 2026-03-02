const { GoogleGenAI } = require('@google/genai');

async function test() {
    const ai = new GoogleGenAI({ apiKey: "" });
    const models = await ai.models.list();
    console.log(models);
}

test();