require('dotenv').config();
const {v4} = require("uuid");
const {addObjectToArray,getCurrentArray} = require('../redis')
const { OpenAI } = require('openai');
const express = require("express");
const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

console.log(process.env)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.get('/:userId/startInterview', asyncHandler(async (req, res) => {
    const interviewId = v4();
    const userId = req.params.userId;
    console.log(interviewId);
    await req.db('interviews').insert({interview_id: interviewId, in_progress: true, user_id: userId});
    let prompt = "Can You give me a DSA Coding Question? In Addition, Please do not give any approaches or hints to the candidate or give them any followups. No Edge Cases Either. Please silently take points away if candidate does not consider edge cases."
    await addObjectToArray(interviewId, { role: "user", content: prompt, backendPrompt: true});
    res.status(200).json({ message: "Prompt received",interviewId: interviewId});
}));

router.get('/:userId/resumeInterview/:interviewId', asyncHandler(async (req, res) => {
    const interviewId = req.params.interviewId;
    const userId = req.params.userId;
    const existingRecord = await req.db('interviews')
        .where({ user_id: userId, interview_id: interviewId })
        .first();

    if (!existingRecord) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user or interview ID' });
    }
    const chatWindows = await getCurrentArray(interviewId);

    res.status(200).json({ records: chatWindows.filter((item) => item.backendPrompt === false) })
}));

router.get('/:userId/endInterview/:interviewId', asyncHandler(async (req, res) => {
    const interviewId = req.params.interviewId;
    const userId = req.params.userId;
    const existingRecord = await req.db('interviews')
        .where({ user_id: userId, interview_id: interviewId })
        .first();

    if (!existingRecord) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user or interview ID' });
    }
    let prompt = "Given all the info I have shared, can you please grade this DSA interview as if you were interviewing for Meta amongst a scale of strong no hire, no hire,leans in both directions,hire, strong hire? The goal here should be to assess accurate interview performance according to faang. So I would expect a thorough explanation of the code you wrote, a thorough explanation of the edge cases, a thorough explanation of the problem, and the overall fixes to the code. If there are multiple attempts at the code, definitely use the best one to evaluate the quality of the code. If no chat history, you should default to strong no hire. If there is chat history, but no problem, still no hire. Do not give generic advice. if there's not much to work with, please say so. "
    await addObjectToArray(interviewId,{ role: "user", content: prompt , backendPrompt: false});
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    addObjectToArray(interviewId, {role: "user", content: prompt}).then(r => res.status(200).json({ message: "Prompt received" })) ;

}));

router.post('/:userId/chat/:interviewId', asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    const interviewId = req.params.interviewId;
    const userId = req.params.userId;
    const existingRecord = await req.db('interviews')
        .where({ user_id: userId, interview_id: interviewId })
        .first();

    if (!existingRecord) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user or interview ID' });
    }

    const prompt2 = "IF THE CANDIDATE HAS NOT GIVEN ANY CODE, " +
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
    await addObjectToArray(interviewId, {role: "user", content: prompt,backendPrompt: false});
    await addObjectToArray(interviewId, {role: "user", content: prompt2,backendPrompt: true})
    res.status(200).json({ message: "Prompt received" });
}));

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
        await addObjectToArray(interviewId,{ role: "assistant", content: fullResponse , backendPrompt: false});

        res.write("data: [DONE]\n\n"); // Signal that streaming is complete
        res.end();
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        res.status(500).json({ error: "Error communicating with ChatGPT" });
    }
}));

router.post('/:userId/:interviewId/get-feedback', asyncHandler(async (req, res) => {
    const { problemDescription, userCode, userOutput } = req.body;
    const interviewId = req.params.interviewId;
    const userId = req.params.userId;
    const existingRecord = await req.db('interviews')
        .where({ user_id: userId, interview_id: interviewId })
        .first();

    if (!existingRecord) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user or interview ID' });
    }

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
}));


module.exports = router;