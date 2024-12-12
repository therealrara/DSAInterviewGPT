import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import Login from "./Login";
import ChatComponent from "./App";
import ResetPassword from "./ResetPassword"; // Import the ResetPassword component

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const [userId, setUserId] = useState("6");

    // Load user session on app load
    useEffect(() => {
        const storedUserId = "6"
        localStorage.setItem("userId", "6");
        localStorage.setItem("userName", "Demo User");
        if (storedUserId) {
            setIsLoggedIn(true);
            setUserId(storedUserId);
        }
    }, []);

    // Save user session when logged in
    const handleLogin = (id) => {
        setIsLoggedIn(true);
        setUserId(id);
        localStorage.setItem("userId", id);
    };

    // Clear user session on logout
    const handleLogout = () => {
    };

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        isLoggedIn ? (
                            <LandingPage
                                setIsLoggedIn={handleLogout}
                                userId={userId}
                            />
                        ) : (
                            <Login setIsLoggedIn={handleLogin} />
                        )
                    }
                />
                <Route
                    path="/interview/:interviewId"
                    element={
                        isLoggedIn ? (
                            <ChatComponent setIsLoggedIn={handleLogout} />
                        ) : (
                            <Login setIsLoggedIn={handleLogin} />
                        )
                    }
                />
                <Route
                    path="/reset-password"
                    element={<ResetPassword />} // Add the ResetPassword route
                />
            </Routes>
        </Router>
    );
};

export default App;
