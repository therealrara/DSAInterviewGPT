import React, { useState } from 'react';

const ChatComponent = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSendPrompt = () => {
    setResponse(''); // Clear previous response

    // Create a new EventSource for the stream
    const eventSource = new EventSource(`/api/chat?prompt=${encodeURIComponent(prompt)}`);

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSource.close();
      } else {
        setResponse((prev) => prev + event.data); // Append new data to response
      }
    };

    eventSource.onerror = (error) => {
      console.error("Error with EventSource:", error);
      eventSource.close();
    };
  };

  return (
      <div>
        <h1>Chat with GPT-3.5</h1>
        <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Type your prompt here..."
            rows="4"
            cols="50"
        />
        <br />
        <button onClick={handleSendPrompt}>Send Prompt</button>
        <h2>Response:</h2>
        <div style={{ whiteSpace: 'pre-wrap', border: '1px solid #ccc', padding: '10px' }}>
          {response}
        </div>
      </div>
  );
};

export default ChatComponent;