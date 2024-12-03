const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies
const port = process.env.PORT;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// Enable CORS if needed
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});


let conversationArr = []

// SSE Endpoint to Stream ChatGPT Response
app.get('/api/startInterview', async (req, res) => {
  conversationArr = []
  let prompt = "Can You give me a DSA Coding Question? In Addition, Please do not give any approaches or hints to the candidate or give them any followups. No Edge Cases Either. Please silently take points away if candidate does not consider edge cases."
  conversationArr.push({ role: "user", content: prompt });
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  let fullResponse = '';
  let chunkBuffer = '';
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Encoding', 'identity');
  res.flushHeaders(); // Im


  try {
    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4o",
        messages: conversationArr,
        stream: true, // Enable streaming
      },
    );

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        // Accumulate full response for storing
        fullResponse += content;

        // Append to chunkBuffer for streaming
        chunkBuffer += content;

        // Check for natural breaks (newlines or double newlines)
        if (chunkBuffer.includes('\n')) {
          const lines = chunkBuffer.split('\n'); // Split into lines

          // Send all complete lines, keep the last incomplete line in the buffer
          for (let i = 0; i < lines.length - 1; i++) {
            res.write(`data: ${lines[i]}\n\n`);
          }

          // Retain the last incomplete line in the buffer
          chunkBuffer = lines[lines.length - 1];
        }
      }
    }

    // Flush any remaining content in the buffer
    if (chunkBuffer) {
      res.write(`data: ${chunkBuffer}\n\n`);
    }

    console.log(fullResponse)
    // Add the full response to the conversation history
    conversationArr.push({ role: "assistant", content: fullResponse });

    res.write("data: [DONE]\n\n"); // Signal that streaming is complete
    res.end();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Error communicating with ChatGPT" });
  }
});

app.get('/api/endInterview', async (req, res) => {
  let prompt = "Given all the info I have shared, can you please grade this DSA interview as if you were interviewing for Meta amongst a scale of strong no hire, no hire,leans in both directions,hire, strong hire? The goal here should be to assess accurate interview performance according to faang. So I would expect a thorough explanation of the code you wrote, a thorough explanation of the edge cases, a thorough explanation of the problem, and the overall fixes to the code. If there are multiple attempts at the code, definitely use the best one to evaluate the quality of the code. If no chat history, you should default to strong no hire. If there is chat history, but no problem, still no hire. Do not give generic advice. if there's not much to work with, please say so. "
  conversationArr.push({ role: "user", content: prompt });
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  let fullResponse = '';
  let chunkBuffer = '';
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Encoding', 'identity');
  res.flushHeaders(); // Im


  try {
    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4o",
        messages: conversationArr,
        stream: true, // Enable streaming
      },
    );

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        // Accumulate full response for storing
        fullResponse += content;

        // Append to chunkBuffer for streaming
        chunkBuffer += content;

        // Check for natural breaks (newlines or double newlines)
        if (chunkBuffer.includes('\n')) {
          const lines = chunkBuffer.split('\n'); // Split into lines

          // Send all complete lines, keep the last incomplete line in the buffer
          for (let i = 0; i < lines.length - 1; i++) {
            res.write(`data: ${lines[i]}\n\n`);
          }

          // Retain the last incomplete line in the buffer
          chunkBuffer = lines[lines.length - 1];
        }
      }
    }

    // Flush any remaining content in the buffer
    if (chunkBuffer) {
      res.write(`data: ${chunkBuffer}\n\n`);
    }

    console.log(fullResponse)
    // Add the full response to the conversation history
    conversationArr.push({ role: "assistant", content: fullResponse });

    res.write("data: [DONE]\n\n"); // Signal that streaming is complete
    res.end();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Error communicating with ChatGPT" });
  }
});

app.get('/api/chat/sse', async (req, res) => {


  let fullResponse = '';
  let chunkBuffer = '';
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Encoding', 'identity');
  res.flushHeaders(); // Im


  try {
    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4o",
        messages: conversationArr,
        stream: true, // Enable streaming
      },
    );

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        // Accumulate full response for storing
        fullResponse += content;

        // Append to chunkBuffer for streaming
        chunkBuffer += content;

        // Check for natural breaks (newlines or double newlines)
        if (chunkBuffer.includes('\n')) {
          const lines = chunkBuffer.split('\n'); // Split into lines

          // Send all complete lines, keep the last incomplete line in the buffer
          for (let i = 0; i < lines.length - 1; i++) {
            res.write(`data: ${lines[i]}\n\n`);
          }

          // Retain the last incomplete line in the buffer
          chunkBuffer = lines[lines.length - 1];
        }
      }
    }

    // Flush any remaining content in the buffer
    if (chunkBuffer) {
      res.write(`data: ${chunkBuffer}\n\n`);
    }

    console.log(fullResponse)
    // Add the full response to the conversation history
    conversationArr.push({ role: "assistant", content: fullResponse });

    res.write("data: [DONE]\n\n"); // Signal that streaming is complete
    res.end();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Error communicating with ChatGPT" });
  }
});

app.post('/api/chat', (req, res) => {
  const { prompt } = req.body;

  const prompt2 = prompt + " IF THE CANDIDATE HAS NOT GIVEN ANY CODE, " +
      "PLEASE STRONGLY VALIDATE THEIR APPROACH AND SERIOUSLY ENSURE THEY GET SIGN OFF ON THE " +
      "SOLUTION. IF THEY WRITE CODE BEFORE DISCUSSING APPROACHES, TRADEOFFS, ETC, PLEASE APPLY " +
      "SEVERE PENALTIES WHEN GRADING THIS. PLEASE DO NOT GIVE THE CANDIDATE HINTS, AND ONLY " +
      "INTERVENE TO CLARIFY THE REQUIREMENTS, CLARIFY THE SCENARIOS. EVEN IF A APPROACH IS " +
      "SUGGESTED BY A CANDIDATE DO NOT GIVE THEM ANY SUBTLE HINTS AT ALL. YOU SHOULD ASK " +
      "A GUIDING QUESTION WITHOUT GIVING ANYTHING AWAY. IF YOU SEE CODE GIVEN BY THE CANDIDATE, " +
      "DO NOT SPIT OUT BETTER CODE. PLEASE ASK THEM TO VERIFY THE SOLUTION. " +
      "IF THEY ARE COMPLETE. PLEASE ASK IF THEY ARE DONE. " +
      "IF THEY SEEM TO BE CLEARLY PASSING THE QUESTION, " +
      "START ASKING THEM FOLLOWUPS OR EVEN GO DEEPER INTO THE PROBLEM. " +
      "ALSO IF THE CANDIDATE GIVES YOU THE CODE, PLEASE DO NOT SPIT OUT " +
      "CONSIDERATIONS CORRECTIONS OR INDICATIONS OF RIGHT OR WRONG, " +
      "BUT PUSH THE CANDIDATE WITHOUT GIVING ANYTHING AWAY AND TREAT THE INTERACTION " +
      "LIKE A REAL INTERVIEW. PROBE DEEPER, ASK QUESTIONS TO SAVE FACE, AND ONCE YOU " +
      "EXHAUST THE OPTIONS SHOULD YOU GIVE AN ANSWER AND SEVERELY DOCK POINTS FOR " +
      "AVOIDING A STRUCTURED APPROACH"

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  conversationArr.push({ role: "user", content: prompt2 });
  res.status(200).json({ message: "Prompt received" });
});

// Define the feedback route directly using `app.post`
app.post('/api/get-feedback', async (req, res) => {
  const { problemDescription, userCode, userOutput } = req.body;

  // Validate the incoming request body
  if (!problemDescription || !userCode || !userOutput) {
    return res.status(400).json({ error: 'Missing parameters in request body' });
  }
  const messages = [
    {
      role: "user",
      content: `
Problem Description: ${problemDescription}

User's Code:
${userCode}

User's Output:
${userOutput}

Evaluate the user's code and output based on the problem description. Provide feedback on:
1. Whether the user's solution is correct.
2. If incorrect, provide hints on what might be wrong.
3. Suggest improvements or optimizations for the code, if possible.
`,
    },
  ];
  conversationArr.push(messages[0])
  try {
    // Call the OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: messages,
        max_tokens: 300,
        temperature: 0.5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    const message = response.data.choices[0].message
    conversationArr.push({ role: "assistant", content: message })

    // Send the response back to the client
    res.json({ feedback: message });
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    res.status(500).json({ error: 'Failed to get feedback from OpenAI.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

