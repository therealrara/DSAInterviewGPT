import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";


const CodingEditor = ({ code, setCode }) => {
    const [output, setOutput] = useState('');
    const [showOutput, setShowOutput] = useState(false);
    const [language, setLanguage] = useState("javascript");
    const [pyodide, setPyodide] = useState(null);

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

        return { userCode, problemDescription, userOutput };
    };

    const assessSolution = async () => {
        const { userCode, problemDescription, userOutput } = getCodeAndOutput();
      
        try {
          const response = await fetch('http://localhost:4000/api/get-feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              problemDescription,
              userCode,
              userOutput,
            }),
          });
      
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
      
          const data = await response.json();
          const feedback = data.feedback.content;          
      
          // Display feedback
          displayFeedback(feedback);
        } catch (error) {
          console.error('Error calling feedback API:', error);
          displayFeedback('Error: Could not retrieve feedback at this time.');
        }
      };
      

    // Display feedback in a feedback container
    const displayFeedback = (feedback) => {
        const feedbackContainer = document.querySelector('.feedback-container');
        if (feedbackContainer) {
            feedbackContainer.innerText = feedback;
        } else {
            const newFeedbackContainer = document.createElement('div');
            newFeedbackContainer.classList.add('feedback-container');
            newFeedbackContainer.innerText = feedback;
            document.body.appendChild(newFeedbackContainer); // Append to body or appropriate container
        }
    };

    const lineHeight = 20;
    const visibleLines = 30;
    const editorHeight = `${lineHeight * visibleLines}px`;

    return (
        <div>
            { }
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
            <button onClick={handleRunCode} style={{ marginTop: '10px' }}>
                Run Code
            </button>
            {showOutput && (<div className="output-container" style={{ marginTop: '20px' }}>
                <h3>Output:</h3>
                <pre>{output}</pre>
            </div>)}
            <button onClick={assessSolution} style={{ marginTop: '10px' }}>
                Get Feedback
            </button>
        </div>
    );
};

export default CodingEditor;
