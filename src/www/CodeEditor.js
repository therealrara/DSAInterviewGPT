import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";

const CodingEditor = ({ code, setCode }) => {
    const [language, setLanguage] = useState("javascript");
    const [output, setOutput] = useState('');
    const [showOutput, setShowOutput] = useState(false);

    const handleEditorChange = (value) => {
        setCode(value);
    };

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
    };

    // Execute the JavaScript code and display output
    const handleRunCode = () => {
        try {
            let logOutput = '';

            // Override console.log to capture logs
            const originalConsoleLog = console.log;
            console.log = (...args) => {
                logOutput += args.join(' ') + '\n';
                originalConsoleLog.apply(console, args); // Still log to browser console
            };

            // Execute the code safely
            // eslint-disable-next-line no-new-func
            const result = new Function(code)();

            // Restore console.log
            console.log = originalConsoleLog;

            // Set the final output (logs + result)
            if (result !== undefined) {
                logOutput += result.toString();
            }
            setOutput(logOutput.trim());
        } catch (error) {
            setOutput(`Error: ${error.message}`);
        }
        setShowOutput(true);
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
            <button onClick={handleRunCode} style={{marginTop: '10px' }}>
                Run Code
            </button>
            {showOutput && (<div className="output-container" style={{ marginTop: '20px' }}>
                <h3>Output:</h3>
                <pre>{output}</pre>
            </div>)}
        </div>
    );
};

export default CodingEditor;
