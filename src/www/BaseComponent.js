import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import Login from "./Login";
import ChatComponent from "./App";

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState("");

    // Load user session on app load
    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
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
        setIsLoggedIn(false);
        setUserId("");
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        localStorage.removeItem("userName");// Clear localStorage
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
                            <ChatComponent setIsLoggedIn={handleLogout}/>
                        ) : (
                            <Login setIsLoggedIn={handleLogin} />
                        )
                    }
                />
            </Routes>
        </Router>
    );
};

export default App;
