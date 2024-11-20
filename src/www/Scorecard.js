import React from "react";
import './Scorecard.css';
import MarkdownRenderer from "./MarkdownRenderer"; // Optional: Add styles for the scorecard

const Scorecard = ({ conversation, onRestart }) => {
    const calculateScore = () => {
        // Example: Calculate a score based on the conversation
        // You can replace this with a more sophisticated logic
        const assistantResponses = conversation.filter(entry => entry.role === "assistant");
        return assistantResponses.length * 10; // Example scoring logic
    };

    const score = calculateScore();

    return (
        <div className="scorecard-container">
            <h2>Interview Scorecard</h2>
            <p>Final Score: {score} points</p>
            <h3>Conversation Summary:</h3>
            <div className="scorecard-summary">
                {conversation.map((entry, index) => (
                    <div
                        key={index}
                        className={entry.role === "user" ? "chat-user" : "chat-assistant"}
                    >
                        <MarkdownRenderer markdownContent={entry.content}/>
                    </div>
                ))}
            </div>
            <button onClick={onRestart}>Restart Interview</button>
        </div>
    );
};

export default Scorecard;
