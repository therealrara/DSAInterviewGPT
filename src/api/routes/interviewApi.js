require('dotenv').config();
const {v4} = require("uuid");
const {addObjectToArray,getCurrentArray} = require('../redis')
const express = require("express");
const {generatePresignedUrl} = require("../s3Storage");
const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get('/:userId/startInterview', asyncHandler(async (req, res) => {
    const interviewId = v4();
    const userId = req.params.userId;
    await req.db('interviews').insert({interview_id: interviewId, in_progress: true, user_id: userId});
    let prompt = "Can You give me a DSA Coding Question? In Addition, Please do not give any approaches or hints to the candidate or give them any followups. No Edge Cases Either. Please silently take points away if candidate does not consider edge cases. The format response should be a bolded title of the question, followed by a warm greeting to the candidate thanking them for the time, then the detailed DSA Leetcode question as if you're the interviewer, then the clarity of instructions to make sure they explain their thought process before coding?"
    await addObjectToArray(interviewId, { role: "user", content: prompt, backendPrompt: true, startPrompt: true, endPrompt: false});
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
    if (existingRecord.interview_feedback) {
        return res.status(200).json({ warning: "interview not found"});
    }
    let prompt = "Given all the info I have shared, can you please grade this DSA interview as if you were interviewing for Meta amongst a scale of strong no hire, no hire,leans in both directions,hire, strong hire? The goal here should be to assess accurate interview performance according to faang. So I would expect a thorough explanation of the code you wrote, a thorough explanation of the edge cases, a thorough explanation of the problem, and the overall fixes to the code. If there are multiple attempts at the code, definitely use the best one to evaluate the quality of the code. If no chat history, you should default to strong no hire. If there is chat history, but no problem, still no hire. Do not give generic advice. if there's not much to work with, please say so. The format should always be beginning with at all times: Score: {Rating} in bold, and then it must be the detailed feeedback. If the response always has a leading text, that is never correct. please make sure it is in form score: {Score} then detailed feedback. "
    await addObjectToArray(interviewId,{ role: "user", content: prompt , backendPrompt: true, startPrompt: false, endPrompt: true});
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    res.status(200).json({ message: "Prompt received" });

}));

router.get('/:userId/fetchInterview/:interviewId', asyncHandler(async (req, res) => {
    const interviewId = req.params.interviewId;
    const userId = req.params.userId;

    const existingRecord = await req.db('interviews')
        .where({ user_id: userId,interview_id: interviewId}).first()
    res.status(200).json({ records: existingRecord })
}));

router.get('/:userId/download/:interviewId', async (req, res) => {
    try {
        const interviewId = req.params.interviewId;
        const userId = req.params.userId;
        const existingRecord = await req.db('interviews')
            .where({ user_id: userId, interview_id: interviewId })
            .first();

        if (!existingRecord) {
            return res.status(401).json({ error: 'Unauthorized: Invalid user or interview ID' });
        }
        const fileName = req.params.interviewId;

        if (!fileName) {
            return res.status(400).json({ error: 'File name is required.' });
        }

        // Generate pre-signed URL
        const downloadUrl = await generatePresignedUrl(fileName, 3600); // URL valid for 1 hour
        res.status(200).json({ url: downloadUrl });
    } catch (error) {
        console.error('Error generating download link:', error.message);
        res.status(500).json({ error: 'Failed to generate download link.' });
    }
});


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
        "AVOIDING A STRUCTURED APPROACH. However, you must help them disambiguate the problem. If you sense they're trying to figure out inputs outputs, " +
        "edge cases, then you can answer to help them move forward. So clarify inputs, outputs, etc. Please act like a interviewer trying to help the candidate if they deserve it. " +
        "Obviously don't help if they're fishing, but help if they are making efforts."

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }
    await addObjectToArray(interviewId, {role: "user", content: prompt,backendPrompt: false, startPrompt: false, endPrompt: false});
    await addObjectToArray(interviewId, {role: "user", content: prompt2,backendPrompt: true, startPrompt: false, endPrompt: false})
    res.status(200).json({ message: "Prompt received" });
}));

router.post('/:userId/codeSubmission/:interviewId', asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    const interviewId = req.params.interviewId;
    const userId = req.params.userId;
    const existingRecord = await req.db('interviews')
        .where({ user_id: userId, interview_id: interviewId })
        .first();

    if (!existingRecord) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user or interview ID' });
    }

    const prompt2 = "The Candidate has given you the code snippet to the problem above. Now that you have received it, you should act like an interviewer if they did not even attempt to solve the problem with you before writing the code. DOCK POINTS SEVERELY. " +
        "THIS IS NOT ALLOWED. . You should NOT point out bugs, or if there are, you have to tell them that bugs " +
        "exist and it is on them to figure them out. You should then ask questions like hey " +
        "can we make the code faster? And then the candidate can go ahead and do anymore help. " +
        "However, PLEASE DO NOT GIVE THE ANSWER OR ANY SUGGESTIONS FOR CODE CLEANLINESS, " +
        "OPTIMIZATIONS NOTHING. YOU GIVING THE ANSWER IN RESPONSE TO THIS CHAT HISTORY " +
        "IS SELF DEFEATING. PLEASE KEEP RESPONSES." +
        " AND ALWAYS TREAT THE RESPONSE ABOVE THIS ONE AS THE PROMPT YOU ARE RESPONDING TO. "

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }
    await addObjectToArray(interviewId, {role: "user", content: prompt,backendPrompt: false, startPrompt: false, endPrompt: false});
    await addObjectToArray(interviewId, {role: "user", content: prompt2,backendPrompt: true, startPrompt: false, endPrompt: false})
    res.status(200).json({ message: "Prompt received" });
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