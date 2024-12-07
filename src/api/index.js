const {v4}  = require('uuid');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OpenAI } = require('openai');
const Redis = require('ioredis');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies
const port = process.env.PORT;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// Replace with your Heroku Redis URL
const redis = new Redis(process.env.REDIS_URL);



// Enable CORS if needed
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
// SSE Endpoint to Stream ChatGPT Response
app.get('/api/startInterview', async (req, res) => {
  const interviewId = v4();
  console.log(interviewId);
  let prompt = "Can You give me a DSA Coding Question? In Addition, Please do not give any approaches or hints to the candidate or give them any followups. No Edge Cases Either. Please silently take points away if candidate does not consider edge cases."
  await addObjectToArray(interviewId, { role: "user", content: prompt });
  res.status(200).json({ message: "Prompt received",interviewId: interviewId});
});

app.get('/api/endInterview/:interviewId', async (req, res) => {
  const interviewId = req.params.interviewId;
  let prompt = "Given all the info I have shared, can you please grade this DSA interview as if you were interviewing for Meta amongst a scale of strong no hire, no hire,leans in both directions,hire, strong hire? The goal here should be to assess accurate interview performance according to faang. So I would expect a thorough explanation of the code you wrote, a thorough explanation of the edge cases, a thorough explanation of the problem, and the overall fixes to the code. If there are multiple attempts at the code, definitely use the best one to evaluate the quality of the code. If no chat history, you should default to strong no hire. If there is chat history, but no problem, still no hire. Do not give generic advice. if there's not much to work with, please say so. "
  await addObjectToArray(interviewId,{ role: "user", content: prompt });
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  addObjectToArray(interviewId, {role: "user", content: prompt}).then(r => res.status(200).json({ message: "Prompt received" })) ;

});

app.post('/api/chat/:interviewId', (req, res) => {
  const { prompt } = req.body;
  const interviewId = req.params.interviewId;

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
  addObjectToArray(interviewId, {role: "user", content: prompt2}).then(r => res.status(200).json({ message: "Prompt received" })) ;
});

app.get('/api/chat/:interviewId/sse', async (req, res) => {

  const interviewId = req.params.interviewId;
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
        messages: await getCurrentArray(interviewId),
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
    await addObjectToArray(interviewId,{ role: "assistant", content: fullResponse });

    res.write("data: [DONE]\n\n"); // Signal that streaming is complete
    res.end();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Error communicating with ChatGPT" });
  }
});



// Define the feedback route directly using `app.post`
app.post('/api/:interviewId/get-feedback', async (req, res) => {
  const { problemDescription, userCode, userOutput } = req.body;
  const interviewId = req.params.interviewId;

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
  await addObjectToArray(interviewId,messages);
  res.status(200).json({ message: "Prompt received" });
});

// Internal method to get the array from Redis
async function getArray(key) {
  const jsonString = await redis.get(key);
  console.log(jsonString);
  return jsonString ? JSON.parse(jsonString) : [];
}

// Internal method to store the array back in Redis
async function storeArray(key, array) {
  const jsonString = JSON.stringify(array);
  const ttlInSeconds = await redis.ttl(key) * 1000; // TTL in seconds
  const currentTimeInSeconds = Date.now();
  const defaultTTL = process.env.REDIS_TTL * 1000; // Ensure it's an integer

  let absoluteExpiration;

  if (array.length > 1 && ttlInSeconds > 0) {
    // Reuse existing TTL as absolute expiration time
    absoluteExpiration = currentTimeInSeconds + (ttlInSeconds);
  } else {
    // Set a new TTL
    absoluteExpiration = currentTimeInSeconds + defaultTTL;
  }

  console.log(absoluteExpiration)
  absoluteExpiration = Math.floor(absoluteExpiration / 1000);

  // Save the key with updated value
  await redis.set(key, jsonString);
  // Set expiration time
  await redis.expireat(key, absoluteExpiration);

  console.log(`Key ${key} will expire at ${new Date(absoluteExpiration * 1000).toISOString()}`);
}


// Public method to add an object to the array
async function addObjectToArray(key, newObject) {
  console.log(key)
  const array = await getArray(key); // Get the existing array
  array.push(newObject); // Add the new object
  await storeArray(key, array); // Store the updated array back
  console.log(`New object added to array under key "${key}":`, newObject);
}

// Public method to retrieve the array
async function getCurrentArray(key) {
  const array = await getArray(key);
  console.log(`Array retrieved from Redis under key "${key}":`, array);
  if (!Array.isArray(array)) {
    throw new Error('Messages must be an array of objects.');
  }
  return array;
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

