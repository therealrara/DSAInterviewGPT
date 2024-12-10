import React, { useState } from "react";
import App from "./App";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import ChatComponent from "./App";
import LandingPage from "./LandingPage";

const Login  = ({ setIsLoggedIn }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);

    const logUserIn = () => {
        if (userName.length > 0 && password.length > 0) {
            setIsLoggedIn(true);
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
    }

    const signUserUp = () => {
        if (userName.length > 0 && password.length > 0) {
            setIsLoggedIn(true);
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
    }
    const setUpSignUpForm = () => {
        setUserName("")
        setPassword("")
        setRepeatPassword("")
        setIsLogin(!isLogin)
    }
    return (
        <div className="login-container">
            {isLogin ? (
                <div className="initial-screen">
                    <textarea
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Username"
                        rows="4"
                        cols="50"
                    />
                    <textarea
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        type="password"
                        rows="4"
                        cols="50"
                        onPaste={(e) => e.preventDefault()} // Prevent pasting for security
                        onCopy={(e) => e.preventDefault()} // Prevent copying the masked value
                    />
                    <button onClick={logUserIn}>
                        Login
                    </button>
                    <button onClick={() => setUpSignUpForm()}>
                        Sign up
                    </button>
                </div>
                ) : (
                <div className="initial-screen">
                    <textarea
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Username"
                        rows="4"
                        cols="50"
                    />
                    <textarea
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="Password"
                        rows="4"
                        cols="50"
                        onPaste={(e) => e.preventDefault()} // Prevent pasting for security
                        onCopy={(e) => e.preventDefault()} // Prevent copying the masked value
                    />
                    <textarea
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        type="password"
                        placeholder="Repeat Password"
                        rows="4"
                        cols="50"
                        onPaste={(e) => e.preventDefault()} // Prevent pasting for security
                        onCopy={(e) => e.preventDefault()} // Prevent copying the masked value
                    />
                    <button onClick={signUserUp}>
                        Sign Up
                    </button>
                    <button onClick={setUpSignUpForm}>
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