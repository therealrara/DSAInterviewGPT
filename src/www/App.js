import React, {useEffect, useState} from "react";
import MarkdownRenderer from './MarkdownRenderer';
import 'katex/dist/katex.min.css';
import "./App.css";
import './ChatAssistant.css';
import Scorecard from './Scorecard';
import Spinner from './Spinner';
import CodingEditor from "./CodeEditor";
import {useNavigate} from "react-router";
import { useLocation, useParams } from "react-router-dom";
require('dotenv').config();

const API_URL = process.env.REACT_APP_API_URL

console.log(API_URL);

const ChatComponent = ({setIsLoggedIn}) => {
    const location = useLocation();
    let isNewInterview = location.state?.isNewInterview || false; // Default to false if not provided
    let inProgress = location.state?.in_progress || false; // Default to false if not provided
    const [conversation, setConversation] = useState([]);
    const { interviewId } = useParams();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isInterviewStarted, setIsInterviewStarted] = useState(true);
    const [isInterviewFinished, setIsInterviewFinished] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [code, setCode] = useState("// Write your code here");
    const userId = localStorage.getItem("userId"); // Retrieve userId from localStorage
    const navigate = useNavigate();

    const handleStartInterview = async () => {
        setConversation([]);
        setLoading(true);
        setIsInterviewStarted(true);
        setIsInterviewFinished(false);

        const path = `/interview/${userId}/chat/${interviewId}/sse`
        const eventSource = new EventSource(API_URL + path);
        let assistantResponse = "";

        eventSource.onmessage = (event) => {
            if (event.data === "[DONE]") {
                setLoading(false);
                eventSource.close();

                setConversation((prev) => [
                    ...prev,
                    { role: "assistant", content: assistantResponse },
                ]);
            } else {
                assistantResponse += event.data + "\n";
            }
        };

        eventSource.onerror = (error) => {
            console.error("Error with SSE (startInterview):", error);
            setLoading(false);
            setIsInterviewStarted(false);
            eventSource.close();
        };
    };

    const handleEndInterview = () => {
        setIsInterviewStarted(false);
        setLoading(false);
        setIsInterviewFinished(true);
    };

    const handleResumeInterview = async () => {
        console.log(API_URL);
        const response = await fetch(API_URL + `/interview/${userId}/resumeInterview/${interviewId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Failed to initiate SSE connection.');
        }
        const body = await response.json()
        console.log(inProgress)
        if (!inProgress) {
            setIsInterviewStarted(false);
            setLoading(false);
            setIsInterviewFinished(true);
        } else {
            setConversation(([]) => {
                return body.records;
            })
        }
    }

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        setConversation((prev) => [...prev, { role: "user", content: message }]);
        setMessage("");
        setIsChatLoading(true);

        const path = `/interview/${userId}/chat/${interviewId}`

        try {
            const response = await fetch(API_URL + path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: message }),
            });

            if (!response.ok) {
                throw new Error('Failed to initiate SSE connection.');
            }

            const eventSource = new EventSource(API_URL + path + '/sse');
            let assistantResponse = "";

            eventSource.onmessage = (event) => {
                if (event.data === "[DONE]") {
                    setIsChatLoading(false);
                    eventSource.close();

                    setConversation((prev) => [
                        ...prev,
                        { role: "assistant", content: assistantResponse },
                    ]);
                } else {
                    assistantResponse += event.data + "\n";
                }
            };

            eventSource.onerror = (error) => {
                console.error("Error with SSE (chat):", error);
                setIsChatLoading(false);
                eventSource.close();
            };
        } catch (error) {
            console.error("Error sending message:", error);
            setIsChatLoading(false);
        }
    };

    useEffect(() => {
        if (isNewInterview) {
            handleStartInterview().then(r => console.log(""));
        } else {
            handleResumeInterview().then(r => console.log(""));
        }
    },[isNewInterview,interviewId])

    const handleRestartInterview = async () => {
        try {
            setConversation([]);
            setMessage("");
            setIsInterviewStarted(true);
            setIsInterviewFinished(false);

            console.log(API_URL);
            const response = await fetch(`${API_URL}/interview/${userId}/startInterview`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Failed to initiate SSE connection.');
            }

            const body = await response.json();
            console.log('API Response:', body);

            if (!body.interviewId) {
                throw new Error('Invalid response: interviewId not found.');
            }
            isNewInterview = true;
            navigate(`/interview/${body.interviewId}`, { state: { isNewInterview: true } });
        } catch (error) {
            console.error('Error restarting interview:', error.message);
        }
    };

    return (
        <div className="chat-container">
            <div className="header-buttons">
                <button onClick={() => navigate("/")}>Main Menu</button>
            </div>
            <h1>Welcome to Your DSA Mock Interview!!</h1>
            {isInterviewStarted && (
                <div className="interview-session">
                    <div className="chat-section">
                        <h2>Chat</h2>
                        <div className="chat-window">
                            {isChatLoading && (
                                <div className="loading-message">
                                    <Spinner /> Loading...
                                </div>
                            )}
                            {conversation.map((entry, index) => (
                                <div
                                    key={index}
                                    className={entry.role === "user" ? "chat-user" : "chat-assistant"}
                                >
                                    <MarkdownRenderer markdownContent={entry.content} />
                                </div>
                            ))}
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            rows="4"
                            cols="50"
                            disabled={isChatLoading}
                        />
                        <button onClick={handleSendMessage} disabled={isChatLoading || !message.trim()}>
                            Submit Response
                        </button>
                        <button onClick={handleEndInterview} disabled={isChatLoading} className="end-interview-button">
                            End Interview
                        </button>
                    </div>

                    <div className="code-editor-section">
                        <h2>Code Editor</h2>
                        <CodingEditor code={code} setCode={setCode} setConversation={setConversation} setIsChatLoading={setIsChatLoading} interviewId={interviewId}/>
                    </div>
                </div>
            )}

            {isInterviewFinished && (
                <Scorecard interviewId={interviewId} conversation={conversation} onRestart={handleRestartInterview} inProgress={inProgress}/>
            )}
        </div>
    );
};

export default ChatComponent;
