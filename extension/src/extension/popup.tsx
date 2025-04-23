/// <reference types="chrome" />
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./popup.css";

const Popup: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get(
      ["correctedText"],
      (result: { correctedText?: string }) => {
        setText(result.correctedText || "");
      }
    );
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Copy failed:", err));
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: 10, width: 300 }}>
      <h2>Corrected Text</h2>
      <textarea value={text} readOnly style={{ width: "100%", height: 150 }} />
      <button
        onClick={copyToClipboard}
        style={{ marginTop: 10, padding: "5px 10px" }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Popup />);

export default Popup;
