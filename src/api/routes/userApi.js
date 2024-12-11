const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
require('dotenv').config();

router.get('/:userId/listInterviews', async (req, res) => {
    const userId = req.params.userId;
    const existingRecord = await req.db('interviews')
        .where({ user_id: userId})
    res.status(200).json({ records: existingRecord })
});


module.exports = router;