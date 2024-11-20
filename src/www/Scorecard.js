import React, { useState } from "react";
import './Scorecard.css';
import MarkdownRenderer from "./MarkdownRenderer";
import Spinner from "./Spinner"; // Import the spinner component

const Scorecard = ({ conversation, onRestart }) => {
    const [loading, setLoading] = useState(false); // Loading state for feedback
    const [feedback, setFeedback] = useState([]); // Feedback from the assistant

    const fetchFeedback = () => {
        setLoading(true); // Show spinner while loading
        const eventSource = new EventSource("/api/endInterview");
        let assistantResponse = "";

        eventSource.onmessage = (event) => {
            if (event.data === "[DONE]") {
                setLoading(false);
                eventSource.close();

                // Add assistant's full response to feedback
                setFeedback((prev) => [
                    ...prev,
                    { role: "assistant", content: assistantResponse },
                ]);
            } else {
                assistantResponse += event.data + "\n"; // Incrementally append data
            }
        };

        eventSource.onerror = (error) => {
            console.error("Error with SSE (endInterview):", error);
            setLoading(false);
            eventSource.close();
        };
    };

    const calculateScore = () => {
        // Simple scoring logic based on conversation
        const assistantResponses = conversation.filter(entry => entry.role === "assistant");
        return assistantResponses.length * 10; // Example scoring logic
    };

    const score = calculateScore();

    // Fetch feedback when the component mounts
    React.useEffect(() => {
        fetchFeedback();
    }, []);

    return (
        <div className="scorecard-container">
            <h2>Interview Scorecard</h2>
            <p>Final Score: {score} points</p>
            <h3>Conversation Summary:</h3>

            {loading ? (
                <Spinner /> // Show spinner while loading feedback
            ) : (
                <div className="scorecard-feedback">
                    <h3>Feedback:</h3>
                    {feedback.map((entry, index) => (
                        <div
                            key={index}
                            className={entry.role === "user" ? "chat-user" : "chat-assistant"}
                        >
                            <MarkdownRenderer markdownContent={entry.content} />
                        </div>
                    ))}
                </div>
            )}

            <div className="scorecard-summary">
                <h3>Conversation:</h3>
                {conversation.map((entry, index) => (
                    <div
                        key={index}
                        className={entry.role === "user" ? "chat-user" : "chat-assistant"}
                    >
                        <MarkdownRenderer markdownContent={entry.content} />
                    </div>
                ))}
            </div>
            <button onClick={onRestart}>Restart Interview</button>
        </div>
    );
};

export default Scorecard;
