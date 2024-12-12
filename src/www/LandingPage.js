import React, { useState, useEffect } from "react";
import App from "./App";
import "./LandingPage.css"
import Spinner from "./Spinner";
import {useNavigate} from "react-router";
const API_URL = process.env.REACT_APP_API_URL
const LandingPage = ({ setIsLoggedIn }) => {
    const [isInterviewStarting, setIsInterviewStarting] = useState(false);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem("userId");
    const navigate = useNavigate();
    const handleCardClick = (interviewId,in_progress) => {
        navigate(`/interview/${interviewId}`,{ state: { isNewInterview: false , in_progress: in_progress} });
    }

    const handleStartInterview = async () => {
        console.log(API_URL);
        const response = await fetch(API_URL + `/interview/${userId}/startInterview`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Failed to initiate SSE connection.');
        }
        const body = await response.json()
        console.log(body);
        navigate(`/interview/${body.interviewId}`,{ state: { isNewInterview: true , in_progress: true} });
    }

    useEffect(() => {
        // Function to fetch interviews from the API
        const fetchInterviews = async () => {
            try {
                const response = await fetch(API_URL + `/users/${userId}/listInterviews`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch interviews");
                }
                const data = await response.json();
                setInterviews(data.records);
            } catch (error) {
                console.error("Error fetching interviews:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchInterviews();
        } else {
            console.error("No user ID found in local storage");
            setLoading(false);
        }
    }, [userId]);

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="container">
            <div className="fixed-title">
                <h1>Welcome {localStorage.getItem("userName")}</h1>
                <h2>Your DSA Mock Interviews</h2>
            </div>
            <button className="start-button" onClick={handleStartInterview}>
                Start New Interview
            </button>
        </div>
    );
};

export default LandingPage;
