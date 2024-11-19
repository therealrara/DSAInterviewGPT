import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import MarkdownRenderer from './MarkdownRenderer';
import 'katex/dist/katex.min.css'; 
import "./App.css";
import './ChatAssistant.css';

const ChatComponent = () => {
    const [conversation, setConversation] = useState([]); // Stores the chat history
    const [message, setMessage] = useState(""); // Current user input
    const [loading, setLoading] = useState(false); // Loading state for SSE

    // Start the interview and stream the first response
    const handleStartInterview = () => {
        setConversation([]); // Reset conversation
        setLoading(true);

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
            eventSource.close();
        };
    };

    // Handle user input and stream the assistant's response
    const handleSendMessage = async () => {
        if (!message.trim()) return;

        // Add user's message to the conversation immediately
        setConversation((prev) => [...prev, { role: "user", content: message }]);
        setMessage(""); // Clear input
        setLoading(true);

        try {
            // Send a POST request to initiate the SSE chat response
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: message }), // Send user input in the request body
            });

            if (!response.ok) {
                throw new Error('Failed to initiate SSE connection.');
            }

            // Create SSE connection to stream the response
            const eventSource = new EventSource('/api/chat/sse');

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
                    assistantResponse += event.data+ "\n"; // Incrementally append data
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


    return (
        <div className="chat-container">
            <h1>Chat with GPT-4</h1>
            <button onClick={handleStartInterview} disabled={loading}>
                {loading ? "Loading..." : "Start Interview"}
            </button>
            <div className="chat-window">
                {conversation.map((entry, index) => (
                    <div
                        key={index}
                        className={entry.role === "user" ? "chat-user" : "chat-assistant"}
                    >
                        <MarkdownRenderer markdownContent={entry.content}/>
                        {/* <ReactMarkdown>{entry.content}</ReactMarkdown> */}
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
        </div>
    );
};

export default ChatComponent;
