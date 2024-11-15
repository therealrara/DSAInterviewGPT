const express = require('express');
const {  OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = 4000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// Enable CORS if needed
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// SSE Endpoint to Stream ChatGPT Response
app.get('/api/chat', async (req, res) => {
  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const completion = await openai.chat.completions.create(
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          stream: true, // Enable streaming
        },
    );

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${content}\n\n`); // Send the chunk to the client
      }
    }

    res.write("data: [DONE]\n\n"); // Signal that streaming is complete
    res.end();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Error communicating with ChatGPT" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
