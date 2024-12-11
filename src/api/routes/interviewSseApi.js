const {getCurrentArray, addObjectToArray} = require("../redis");
require('dotenv').config();
const {v4} = require("uuid");
const { OpenAI } = require('openai');
const express = require("express");
const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.get('/:userId/chat/:interviewId/sse', asyncHandler(async (req, res) => {

    const interviewId = req.params.interviewId;
    const userId = req.params.userId;
    const existingRecord = await req.db('interviews')
        .where({ user_id: userId, interview_id: interviewId })
        .first();

    if (!existingRecord) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user or interview ID' });
    }
    let fullResponse = '';
    let chunkBuffer = '';
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Content-Encoding', 'identity');
    res.flushHeaders(); // Im

    const conversationArray = await getCurrentArray(interviewId)
    try {
        const completion = await openai.chat.completions.create(
            {
                model: "gpt-4o",
                messages: conversationArray,
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
        await addObjectToArray(interviewId,{ role: "assistant", content: fullResponse , backendPrompt: false, startPrompt: false});

        res.write("data: [DONE]\n\n"); // Signal that streaming is complete
        res.end();
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        res.status(500).json({ error: "Error communicating with ChatGPT" });
    }
}));

module.exports = router