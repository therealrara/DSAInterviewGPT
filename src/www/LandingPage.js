import React, { useState } from "react";
import Login from "./Login";
import Spinner from "./Spinner";
import App from "./App";
const LandingPage = ({setIsLoggedIn}) => {
    const [isInterviewStarting,setIsInterviewStarting] = useState(false);
    if (isInterviewStarting) {
        return <App setIsLoggedIn={setIsLoggedIn}/>
    }
    return (<div class="container">
        <button onClick={() => setIsLoggedIn(false)}>Logout</button>
        <div className="initial-screen">
            <h1>Click for Free DSA Mock Interview</h1>
            <button onClick={() => setIsInterviewStarting(true)}>
                Start Interview
            </button>
        </div>
    </div>);
}

export default LandingPage;