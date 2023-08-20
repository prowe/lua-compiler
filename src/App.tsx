import { FormEventHandler, useReducer, useState } from 'react'
import styles from "./App.module.css";
import {executeCode} from "./runtime.js";

function outputLinesReducer(existingLines: string[], line: string) {
  return [...existingLines, line];
}

function App() {
  const [code, setCode] = useState("");
  const [outputLines, setOutputLines] = useState<string[]>([]); //useReducer(outputLinesReducer, []);
  const runCode: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setOutputLines([]);

    const lines = [];
    const envHooks = {
      output(...args) {
        lines.push(args.join(" "));
      }
    }
    try {
      const result = executeCode(code, envHooks);
      lines.push(`${result.value}`);
    } catch (e) {
      lines.push(`Error: ${e.toString()}`);
    }
    setOutputLines(lines);
  };

  return (
    <>
      <h1>LUA Interpreter</h1>
      <form onSubmit={runCode} className={styles.codeForm}>
        <textarea 
          value={code} 
          onChange={e => setCode(e.currentTarget.value)}
          rows={30}
        />
        <button type="submit">Run</button>
      </form>

      <ul>
        {outputLines.map((line, idx) => <li key={idx}>{line}</li>)}
      </ul>
    </>
  )
}

export default App
