import React, { useState } from "react";
import MarkdownRenderer from './MarkdownRenderer';
import 'katex/dist/katex.min.css';
import "./App.css";
import './ChatAssistant.css';
import Scorecard from './Scorecard';
import Spinner from './Spinner';
import CodingEditor from "./CodeEditor";

const ChatComponent = () => {
    const [conversation, setConversation] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isInterviewStarted, setIsInterviewStarted] = useState(false);
    const [isInterviewFinished, setIsInterviewFinished] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [code, setCode] = useState("// Write your code here");

    const handleStartInterview = () => {
        setConversation([]);
        setLoading(true);
        setIsInterviewStarted(true);
        setIsInterviewFinished(false);

        const eventSource = new EventSource("/api/startInterview");
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

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        setConversation((prev) => [...prev, { role: "user", content: message }]);
        setMessage("");
        setIsChatLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: message }),
            });

            if (!response.ok) {
                throw new Error('Failed to initiate SSE connection.');
            }

            const eventSource = new EventSource('/api/chat/sse');
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

    const handleRestartInterview = () => {
        setConversation([]);
        setMessage("");
        setIsInterviewStarted(false);
        setIsInterviewFinished(false);
    };

    return (
        <div className="chat-container">
            {!isInterviewStarted && !isInterviewFinished && (
                <div className="initial-screen">
                    <h1>Click for Free DSA Mock Interview</h1>
                    {loading ? (
                        <Spinner />
                    ) : (
                        <button onClick={handleStartInterview} disabled={loading}>
                            Start Interview
                        </button>
                    )}
                </div>
            )}

            {isInterviewStarted && (
                <div className="interview-session">
                    <div className="chat-section">
                        <h2>Chat</h2>
                        <div className="chat-window">
                            {conversation.map((entry, index) => (
                                <div
                                    key={index}
                                    className={entry.role === "user" ? "chat-user" : "chat-assistant"}
                                >
                                    <MarkdownRenderer markdownContent={entry.content} />
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="loading-message">
                                    <Spinner /> {}
                                </div>
                            )}
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
                        <CodingEditor code={code} setCode={setCode} />
                        <button
                            onClick={() => console.log("Code Submitted:", code)}
                            disabled={isChatLoading}
                        >
                            Submit Code
                        </button>
                    </div>
                </div>
            )}

            {isInterviewFinished && (
                <Scorecard conversation={conversation} onRestart={handleRestartInterview} />
            )}
        </div>
    );
};

export default ChatComponent;
