import React, {useState} from "react";
import './Scorecard.css';
import MarkdownRenderer from "./MarkdownRenderer";
import Spinner from "./Spinner";
import {useNavigate} from "react-router"; // Import the spinner component

const API_URL = process.env.REACT_APP_API_URL

const Scorecard = ({interviewId, conversation, onRestart, inProgress}) => {
    const [loading, setLoading] = useState(false); // Loading state for feedback
    const [feedback, setFeedback] = useState([]); // Feedback from the assistant
    const userId = localStorage.getItem("userId");
    const navigate = useNavigate();
    const [score, setScore] = useState("");
    const fetchFeedback = async () => {
        let feedback = {};
        if (inProgress) {
            setLoading(true); // Show spinner while loading
            const response = await fetch(API_URL + `/interview/${userId}/endInterview/${interviewId}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            });

            if (!response.ok) {
                throw new Error('Failed to initiate SSE connection.');
            }
            const path = `/interview/${userId}/chat/${interviewId}/sse`
            const eventSource = new EventSource(API_URL + path);
            let assistantResponse = "";

            eventSource.onmessage = (event) => {
                if (event.data === "[DONE]") {
                    setLoading(false);
                    eventSource.close();

                    // Add assistant's full response to feedback
                    setFeedback((prev) => [
                        ...prev,
                        {role: "assistant", content: assistantResponse},
                    ]);
                } else {
                    assistantResponse += event.data + "\n"; // Incrementally append data
                }
            };
            feedback = parseFeedback(assistantResponse);

            eventSource.onerror = (error) => {
                console.error("Error with SSE (endInterview):", error);
                setLoading(false);
                eventSource.close();
            };
        }
        const response = await fetch(API_URL + `/interview/${userId}/fetchInterview/${interviewId}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });
        if (!response.ok) {
            throw new Error('Failed to initiate SSE connection.');
        }
        const body = await response.json()
        if (!inProgress) {
            console.log(body)
            setFeedback(([]) => [{role: "assistant", content: body.records.interview_feedback}]);
        }
        setScore(body.records.score);
        if (score == "") {
            setScore(feedback.score);
        }
        console.log(score)
    };

    function parseFeedback(input) {
        const scoreRegex = /^\*\*Score:\s*(.*?)\*\*/; // Match the "Score" field
        const scoreMatch = input.match(scoreRegex); // Extract the score
        let score = "Rating Not Determinable"; // Extract the score value
        let interview_feedback = input // Remove the score part and trim the rest
        if (scoreMatch) {
            score = scoreMatch[1]; // Extract the score value
            interview_feedback = input.replace(scoreMatch[0], "").trim();
            ;
        }


        return {
            score,
            interview_feedback,
        };
    }

    // Fetch feedback when the component mounts
    React.useEffect(() => {
        fetchFeedback();
    }, []);

    const downloadFeedback = async() => {
        // Step 1: Call the backend API to get the pre-signed URL
        const response = await fetch(API_URL + `/interview/${userId}/download/${interviewId}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });

        if (!response.ok) {
            throw new Error('Failed to fetch pre-signed URL from the backend.');
        }

        const { url } = await response.json();

        // Step 2: Use the pre-signed URL to download the file from S3
        const fileResponse = await fetch(url, {
            method: 'GET',
        });

        if (!fileResponse.ok) {
            throw new Error('Failed to download the file from S3.');
        }

        const fileBlob = await fileResponse.blob();

        // Step 3: Create a download link for the user
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(fileBlob);
        downloadLink.download = interviewId + ".json"; // Set the file name for download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        console.log('Feedback file downloaded successfully.');
    }



return (
        <div className="scorecard-container">
            <h2>Interview Scorecard</h2>
            <p>Final Score: {score}</p>
            <h3>Conversation Summary:</h3>

            {loading ? (
                <Spinner/> // Show spinner while loading feedback
            ) : (
                <div className="scorecard-feedback">
                    <h3>Feedback:</h3>
                    {feedback.map((entry, index) => (
                        <div
                            key={index}
                            className={entry.role === "user" ? "chat-user" : "chat-assistant"}
                        >
                            <MarkdownRenderer markdownContent={entry.content}/>
                        </div>
                    ))}
                </div>
            )}
            {inProgress ? (
                <div className="scorecard-summary">
                    <h3>Conversation:</h3>
                    {conversation.map((entry, index) => (
                        <div
                            key={index}
                            className={entry.role === "user" ? "chat-user" : "chat-assistant"}
                        >
                            <MarkdownRenderer markdownContent={entry.content}/>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="scorecard-summary">
                    <h3>Conversation:</h3>
                    <button onClick={downloadFeedback}>Download Transcript Here</button>
                </div>
            )}
            <button onClick={onRestart}>Restart Interview</button>
            <button onClick={() => navigate("/")}>Main Menu</button>
        </div>
    );
};

export default Scorecard;
