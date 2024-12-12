import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_API_URL;

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();
    const token = searchParams.get("token"); // Get the token from URL

    const handleResetPassword = async () => {
        if (!token) {
            toast.error("Invalid or expired token.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login/resetPassword`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, newPassword }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to reset password.");
                return;
            }

            toast.success("Password reset successful!");
            navigate("/"); // Redirect to login
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="reset-password-container">
            <h1>Reset Password</h1>
            <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
            />
            <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
            />
            <button onClick={handleResetPassword} className="primary-button">
                Reset Password
            </button>
        </div>
    );
};

export default ResetPassword;
