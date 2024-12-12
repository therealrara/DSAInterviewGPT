import React, { useState } from "react";
import App from "./App";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import ChatComponent from "./App";
import LandingPage from "./LandingPage";
import './Login.css';
require('dotenv').config();


const API_URL = process.env.REACT_APP_API_URL

const Login  = ({ setIsLoggedIn , setUserId}) => {
    const [isLogin, setIsLogin] = useState(true);
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState("");

    const  validatePassword = (password) => {
        const minLength = 8;
        const hasLetter = /[a-zA-Z]/; // Regex to check for at least one letter
        const hasNumber = /\d/;       // Regex to check for at least one number

        if (password.length < minLength) {

            toast.error("Password must be at least 8 characters long.", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return false;
        }

        if (!hasLetter.test(password)) {
            toast.error("Password must be at least 1 letter", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return false;
        }

        if (!hasNumber.test(password)) {
            toast.error("Must Have Number", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return false;
        }

        return true;
    }

    const validateEmail = (email) => {
        // Basic email regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            toast.error("Email is required!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return false;
        }

        if (!emailRegex.test(email)) {
            toast.error("Invalid email format! Please enter a valid email address.", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            return false;
        }

        return true;
    };


    const logUserIn = async () => {
        if (userName.length > 7 && password.length > 0) {
            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userName: userName, password }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    toast.error(errorData.error || "Login failed!", {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    return;
                }

                const data = await response.json();
                toast.success("Login successful!", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                // Save token or handle session
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("userId", data.userId);
                localStorage.setItem("userName", data.userName);
                setIsLoggedIn(data.userId);
            } catch (error) {
                console.error("Error logging in:", error);
                toast.error("Something went wrong. Please try again later!", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        } else {
            toast.error("Username and Password are required!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    const signUserUp = async () => {
        if (userName.length > 0 && password.length > 0) {
            if (!validatePassword(password)) {
                return;
            }
            try {
                const response = await fetch(`${API_URL}/login/signup`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userName: userName, password ,email}),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    toast.error(errorData.error || "Signup failed!", {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    return;
                }

                toast.success("Signup successful! Please log in.", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                setUserName("")
                setPassword("")
                setRepeatPassword("")
                setIsLogin(!isLogin)
            } catch (error) {
                console.error("Error signing up:", error);
                toast.error("Something went wrong. Please try again later!", {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        } else {
            toast.error("Username and Password are required!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    const setUpSignUpForm = () => {
        setUserName("")
        setPassword("")
        setRepeatPassword("")
        setEmail("")
        setIsLogin(!isLogin)
    }

    const setUpForgotPassword = () => {
        setUserName("")
        setPassword("")
        setRepeatPassword("")
        setEmail("")
        setIsForgotPassword(!isForgotPassword)
    }

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error("Email is required.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login/forgotPassword`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to send reset link.");
                return;
            }

            toast.success("Password reset link sent to your email.");
            setIsForgotPassword(false);
            setEmail("");
        } catch (error) {
            console.error("Error sending forgot password email:", error);
            toast.error("Something went wrong. Please try again later.");
        }
    };
    return (
        <div className="login-container">
            {isForgotPassword ? (
                <div className="initial-screen">
                    <h1>Forgot Password</h1>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        type="email"
                        className="input-field"
                    />
                    <button onClick={handleForgotPassword} className="primary-button">
                        Send Reset Link
                    </button>
                    <button onClick={setUpForgotPassword} className="secondary-button">
                        Back to Login
                    </button>
                </div>
            ) : isLogin ? (
                <div className="initial-screen">
                    <h1>Welcome to the Data Structures and Algorithms Mock Interview Bot</h1>
                    <h1>Log in</h1>
                    <input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Username"
                        type="text"
                        className="input-field"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        className="input-field"
                    />
                    <button onClick={logUserIn} className="primary-button">
                        Login
                    </button>
                    <button onClick={setUpSignUpForm} className="secondary-button">
                        Sign up
                    </button>
                    <button onClick={setUpForgotPassword} className="link-button">
                        Forgot Password?
                    </button>
                </div>
            ) : (
                <div className="initial-screen">
                    <h1>Welcome to the Data Structures and Algorithms Mock Interview Bot</h1>
                    <h1>Sign up</h1>
                    <input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Username"
                        type="text"
                        className="input-field"
                    />
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        type="text"
                        className="input-field"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        className="input-field"
                    />
                    <input
                        type="password"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        placeholder="Repeat Password"
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        className="input-field"
                    />
                    <button onClick={signUserUp} className="primary-button">
                        Sign Up
                    </button>
                    <button onClick={setUpSignUpForm} className="secondary-button">
                        Return to Login
                    </button>
                </div>
            )}
            <ToastContainer />
        </div>

        //Text area for userna
        //text area for password (password masking)
        //Sign Up Button
    );
}
export default Login;