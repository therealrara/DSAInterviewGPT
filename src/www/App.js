import React, { useState } from "react";
import MarkdownRenderer from './MarkdownRenderer';
import 'katex/dist/katex.min.css';
import "./App.css";
import './ChatAssistant.css';
import Scorecard from './Scorecard';
import Spinner from './Spinner'; // Import the spinner component

const ChatComponent = () => {
    const [conversation, setConversation] = useState([]); // Stores the chat history
    const [message, setMessage] = useState(""); // Current user input
    const [loading, setLoading] = useState(false); // Loading state for SSE
    const [isInterviewStarted, setIsInterviewStarted] = useState(false); // Track if interview has started
    const [isInterviewFinished, setIsInterviewFinished] = useState(false); // Track if interview has ended

    // Start the interview and stream the first response
    const handleStartInterview = () => {
        setConversation([]); // Reset conversation
        setLoading(true);
        setIsInterviewStarted(true); // Mark the interview as started
        setIsInterviewFinished(false); // Reset finished state

        const eventSource = new EventSource("/api/startInterview");
        let assistantResponse = "";

        eventSource.onmessage = (event) => {
            if (event.data === "[DONE]") {
                setLoading(false);
                eventSource.close();

                // Add assistant's full response to the conversation
                setConversation((prev) => [
                    ...prev,
                    { role: "assistant", content: assistantResponse },
                ]);
            } else {
                assistantResponse += event.data + "\n"; // Incrementally append data
            }
        };

        eventSource.onerror = (error) => {
            console.error("Error with SSE (startInterview):", error);
            setLoading(false);
            setIsInterviewStarted(false); // Reset state if error occurs
            eventSource.close();
        };
    };

    // Handle ending the interview
    const handleEndInterview = () => {
        setIsInterviewStarted(false); // Mark the interview as ended
        setLoading(false); // Stop any loading
        setIsInterviewFinished(true); // Transition to scorecard
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        setConversation((prev) => [...prev, { role: "user", content: message }]);
        setMessage(""); // Clear input
        setLoading(true);

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
                console.error("Error with SSE (chat):", error);
                setLoading(false);
                eventSource.close();
            };
        } catch (error) {
            console.error("Error sending message:", error);
            setLoading(false);
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
                <>
                    <h1>Click for Free DSA Mock Interview</h1>
                    {loading ? (
                        <Spinner /> // Show spinner while loading
                    ) : (
                        <button onClick={handleStartInterview} disabled={loading}>
                            Start Interview
                        </button>
                    )}
                </>
            )}

            {isInterviewStarted && !isInterviewFinished && (
                <>
                    <h1>DSA Interview Session</h1>
                    {loading && <Spinner />} {/* Show spinner while streaming response */}
                </>
            )}

            {isInterviewStarted && (
                <>
                    <div className="chat-window">
                        {conversation.map((entry, index) => (
                            <div
                                key={index}
                                className={entry.role === "user" ? "chat-user" : "chat-assistant"}
                            >
                                <MarkdownRenderer markdownContent={entry.content}/>
                            </div>
                        ))}
                    </div>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows="4"
                        cols="50"
                        disabled={loading}
                    />
                    <br />
                    <button onClick={handleSendMessage} disabled={loading || !message.trim()}>
                        Submit Response
                    </button>
                    <button onClick={handleEndInterview} disabled={loading} className="end-interview-button">
                        End Interview
                    </button>
                </>
            )}

            {isInterviewFinished && (
                <Scorecard conversation={conversation} onRestart={handleRestartInterview} />
            )}
        </div>
    );
};

export default ChatComponent;
