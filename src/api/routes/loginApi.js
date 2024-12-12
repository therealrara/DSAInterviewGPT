const express = require("express");
const bcrypt = require("bcryptjs");
const sgMail = require('@sendgrid/mail');
const jwt = require("jsonwebtoken");
const router = express.Router();
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_KEY);

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
const SECRET_KEY = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '15m';
router.post('/', asyncHandler(async (req, res) => {
    const {userName, password} = req.body;
    try {
        // Simulate fetching user from database
        const user = await req.db("users").select("*").where({username: userName}).first();

        // Check if user exists
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({error: "Invalid credentials"});
        }

        // Generate JWT
        const token = jwt.sign({userName: user.userName}, SECRET_KEY, {expiresIn: "1h"});

        res.status(200).json({message: "Login successful", token, userId: user.id, userName: user.username});
    } catch (error) {
        res.status(500).json({error: "Internal Server Error"});
    }
}));

router.post('/signup', asyncHandler(async (req, res) => {
    const {userName, password, email} = req.body;

    try {
        // Check if the username already exists
        const existingUser = await req.db('users').where({username: userName}).first();
        if (existingUser) {
            return res.status(400).json({error: 'Username already exists'});
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        await req.db('users').insert({username: userName, password: hashedPassword, email: email});

        res.status(201).json({message: 'User created successfully'});
    } catch (error) {
        console.error('Error saving user:', error.message);
        res.status(500).json({error: 'Internal Server Error'});
    }
}));

router.post('/forgotPassword', asyncHandler(async (req, res) => {
        const {email} = req.body;

        // Find user by email
        const user = await req.db('users').where({email: email}).first(); // Adjust based on your DB schema
        if (!user) {
            return res.status(404).json({message: 'Email is Not Found'});
        }

        // Generate a secure token
        const token = jwt.sign({userId: user.id}, SECRET_KEY, {expiresIn: TOKEN_EXPIRY});

        // Construct the reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        // Send email
        const msg = {
            to: email,
            from: process.env.SUPPORT_EMAIL, // Your verified sender email
            subject: 'Password Reset Request',
            html: `
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
      `,
        };
        const response = await sgMail.send(msg);

        res.status(200).json({message: 'If this email exists, a reset link has been sent.'});
    })
);

router.post(
    '/resetPassword',
    asyncHandler(async (req, res) => {
        const {token, newPassword} = req.body;

        try {
            // Verify the token
            const decoded = jwt.verify(token, SECRET_KEY);

            // Find the user
            const user = await req.db('users').where({id: decoded.userId});
            if (!user) {
                return res.status(400).json({message: 'Invalid or expired token.'});
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await req.db('users').where({id: decoded.userId}).update({password: hashedPassword})
            res.status(200).json({message: 'Password has been reset successfully.'});
        } catch (error) {
            res.status(400).json({message: 'Invalid or expired token.'});
        }
    })
);


module.exports = router;