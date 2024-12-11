import React, { useState, useEffect } from "react";
import App from "./App";
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
            <button onClick={() => setIsLoggedIn(false)}>Logout</button>
            <h1>Welcome {localStorage.getItem("userName")}</h1>
            <h2>Your DSA Mock Interviews</h2>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
                padding: "20px"
            }}>
                {interviews.map((interview) => (
                    <div
                        key={interview.id}
                        onClick={() => handleCardClick(interview.interview_id,interview.in_progress)}
                        style={{
                            background: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            padding: "16px",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
                        }}
                    >
                        <h3 style={{ margin: "0 0 12px", fontSize: "1.25rem", color: "#333" }}>
                            Interview Question: {interview.title !== null ? interview.title : "No Title"}
                        </h3>
                        <p style={{ margin: "8px 0", fontSize: "0.9rem", color: "#666" }}>
                            <strong>Score:</strong> {interview.score !== null ? interview.score : "No Score Yet"}
                        </p>
                        <p style={{ margin: "8px 0", fontSize: "0.9rem", color: "#666" }}>
                            <strong>State:</strong> {interview.in_progress ? "In Progress" : "Finished"}
                        </p>
                        <p style={{ margin: "8px 0", fontSize: "0.9rem", color: "#666" }}>
                            <strong>Created At:</strong> {new Date(interview.created_at).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            <button onClick={handleStartInterview}>
                Start New Interview
            </button>
        </div>
    );
};

export default LandingPage;
