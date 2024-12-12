import React, {useState, useEffect} from "react";
import CodeMirror from "@uiw/react-codemirror";
import {javascript} from "@codemirror/lang-javascript";
import {python} from "@codemirror/lang-python";

const API_URL = process.env.REACT_APP_API_URL

const CodingEditor = ({code, setCode, setConversation, interviewId, setIsChatLoading}) => {
    const [output, setOutput] = useState('');
    const [showOutput, setShowOutput] = useState(false);
    const [language, setLanguage] = useState("javascript");
    const [pyodide, setPyodide] = useState(null);
    const userId = localStorage.getItem("userId");

    // Load Pyodide when the component mounts
    useEffect(() => {
        if (language === 'python') {
            const loadPyodide = async () => {
                if (window.loadPyodide) {
                    const pyodideInstance = await window.loadPyodide();
                    setPyodide(pyodideInstance);
                } else {
                    console.error('Pyodide failed to load.');
                }
            };
            loadPyodide();
        }
    }, [language]);

    const handleEditorChange = (value) => {
        setCode(value);
    };

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
        setOutput(''); // clears the output when the language changes
        setShowOutput(false);
    };

    // Execute the JavaScript code and display output
    const handleRunCode = async () => {
        setShowOutput(true);
        if (language === 'javascript') {
            try {
                let logOutput = '';

                // Override console.log to capture logs
                const originalConsoleLog = console.log;
                console.log = (...args) => {
                    logOutput += args.join(' ') + '\n';
                    originalConsoleLog.apply(console, args); // Still log to browser console
                };

                // eslint-disable-next-line no-new-func
                const result = new Function(code)();

                console.log = originalConsoleLog;

                // Set the final output (logs + result)
                if (result !== undefined) {
                    logOutput += result.toString();
                }
                setOutput(logOutput.trim());
            } catch (error) {
                setOutput(`Error: ${error.message}`);
            }
        } else if (language === 'python' && pyodide) {
            try {
                // const result = await pyodide.runPythonAsync(code);
                // setOutput(result);
                let pyOutput = '';

                // Override the print function in Python to capture output
                pyodide.runPython(`
              import sys
              from js import console

              class OutputCapture:
                  def __init__(self):
                      self.output = []

                  def write(self, s):
                      self.output.append(s)

                  def flush(self):
                      pass

              sys.stdout = OutputCapture()
              sys.stderr = sys.stdout
            `);

                // Execute the Python code
                const result = pyodide.runPython(code);

                // Get the captured output
                const capturedOutput = pyodide.globals.get('sys').stdout.output.toJs();
                pyOutput = capturedOutput.join('');

                // Include the return value if it's not None
                if (result !== null && result !== undefined) {
                    pyOutput += `\nReturn Value: ${result}`;
                }

                // Set the output
                setOutput(pyOutput);
            } catch (error) {
                setOutput(`Error: ${error.message}`);
            }
        }

    };

    // Capture the code, output, and problem description for assessment
    const getCodeAndOutput = () => {
        // Assuming the problem description is within the `chat-window` div
        const problemElement = document.querySelector('.chat-window');
        const problemDescription = problemElement ? problemElement.innerText : '';

        // User code is already in state
        const userCode = code;

        // Output is also in state
        const userOutput = output;

        return {userCode, problemDescription, userOutput};
    };

    const assessSolution = async () => {
        const {userCode, problemDescription, userOutput} = getCodeAndOutput();

        try {
            setConversation((prev) => [
                ...prev,
                { role: "user", content: `\`\`\`\n${userCode}\n\`\`\`` }
            ]);
            setIsChatLoading(true);

            const path = `/interview/${userId}/codeSubmission/${interviewId}`
            const response = await fetch(API_URL + path, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({prompt: `\`\`\`\n${userCode}\n\`\`\``}),
            });

            if (!response.ok) {
                throw new Error('Failed to initiate SSE connection.');
            }
            const eventSource = new EventSource(API_URL + `/interview/${userId}/chat/${interviewId}/sse`);
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
            console.error('Error calling feedback API:', error);
        }
    };

    const lineHeight = 20;
    const visibleLines = 30;
    const editorHeight = `${lineHeight * visibleLines}px`;

    return (
        <div>
            {}
            <select
                value={language}
                onChange={handleLanguageChange}
                style={{
                    marginBottom: "10px",
                    padding: "5px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                }}
            >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
            </select>

            {/* Code editor container */}
            <div
                style={{
                    height: editorHeight,
                    maxHeight: editorHeight,
                    overflowY: "scroll",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    background: "#1e1e1e",
                }}
            >
                <CodeMirror
                    value={code}
                    extensions={[
                        language === "javascript" && javascript(),
                        language === "python" && python(),
                    ].filter(Boolean)}
                    theme="dark"
                    height="100%"
                    onChange={handleEditorChange}
                    options={{
                        lineNumbers: true,
                        highlightActiveLine: true,
                        indentUnit: 4,
                        tabSize: 4,
                        scrollbarStyle: "native",
                    }}
                />
            </div>
            <button onClick={handleRunCode} style={{marginTop: '10px'}}>
                Run Code
            </button>
            {showOutput && (<div className="output-container" style={{marginTop: '20px'}}>
                <h3>Output:</h3>
                <pre>{output}</pre>
            </div>)}
            <button onClick={assessSolution} style={{marginTop: '10px'}}>
                Get Feedback
            </button>
        </div>
    );
};

export default CodingEditor;
