const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
require('dotenv').config();


const SECRET_KEY = process.env.JWT_SECRET;
router.post('/', async (req,res) => {
    const { userName, password} = req.body;
    try {
        // Simulate fetching user from database
        const user = await req.db("users").select("*").where({ username: userName }).first();

        // Check if user exists
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT
        const token = jwt.sign({ userName: user.userName }, SECRET_KEY, { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token , userId: user.id});
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
})

router.post('/signup', async (req, res) => {
    const { userName, password } = req.body;

    try {
        // Check if the username already exists
        const existingUser = await req.db('users').where({ username: userName }).first();
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await req.db('users').insert({ username: userName, password: hashedPassword });

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error saving user:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;