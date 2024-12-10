import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import Login from "./Login";

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        isLoggedIn ? (
                            <LandingPage setIsLoggedIn={setIsLoggedIn} />
                        ) : (
                            <Login setIsLoggedIn={setIsLoggedIn} />
                        )
                    }
                />
            </Routes>
        </Router>
    );
};

export default App;
