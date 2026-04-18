import React, { useState } from "react";
import { encryptAES, encryptCaesar } from "../crypto/encryptor";
import CryptoProcessSteps from "./CryptoProcessSteps";

const ALGORITHMS = [
  { value: "AES", label: "AES-256-GCM (Recommended)" },
  { value: "Caesar", label: "Caesar (Demo cơ bản)" },
];

export default function EncryptPanel() {
  const [inputText, setInputText] = useState("");
  const [password, setPassword] = useState("");
  const [algorithm, setAlgorithm] = useState("AES");
  const [autoSalt, setAutoSalt] = useState(false);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);
  const [processRun, setProcessRun] = useState(0);
  const [processCompleted, setProcessCompleted] = useState(false);

  const handleEncrypt = async () => {
    if (!inputText.trim()) {
      setStatus({ type: "error", msg: "Vui lòng nhập văn bản đầu vào." });
      return;
    }
    if (!password) {
      setStatus({ type: "error", msg: "Vui lòng nhập mật khẩu / key." });
      return;
    }

    setLoading(true);
    setStatus(null);
    setResult("");
    setProcessCompleted(false);
    setProcessRun((v) => v + 1);

    try {
      let encrypted;
      if (algorithm === "AES") {
        encrypted = await encryptAES(inputText.trim(), password);
      } else {
        encrypted = encryptCaesar(inputText.trim(), password);
      }
      setResult(encrypted);
      setStatus({ type: "success", msg: "Mã hóa thành công!" });
      setProcessCompleted(true);
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
      setProcessCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encrypted_result.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInputText(ev.target.result);
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleClear = () => {
    setInputText("");
    setPassword("");
    setResult("");
    setStatus(null);
    setAlgorithm("AES");
    setProcessCompleted(false);
  };

  return (
    <div className="panel panel-with-visual">
      <div className="panel-content">
        <div className="panel-header">
          <span className="panel-icon encrypt-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <h2 className="panel-title">Encrypt</h2>
        </div>

        <div className="field-group">
          <label className="field-label">Input Data</label>
          <textarea
            className="field-textarea"
            placeholder="Enter the plaintext you wish to secure..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
          />
          <label className="file-btn" title="Open file">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Open File
            <input
              type="file"
              accept=".txt"
              onChange={handleOpenFile}
              style={{ display: "none" }}
            />
          </label>
        </div>

        <div className="field-group">
          <label className="field-label">Encryption Key</label>
          <div className="password-wrapper">
            <input
              type={showPass ? "text" : "password"}
              className="field-input"
              placeholder="Enter your secret key..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="toggle-pass"
              onClick={() => setShowPass((v) => !v)}
              tabIndex={-1}
            >
              {showPass ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Algorithm</label>
          <div className="select-wrapper">
            <select
              className="field-select"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              {ALGORITHMS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <span className="select-arrow">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>

        <div className="checkbox-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoSalt}
              onChange={(e) => setAutoSalt(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-box" />
            Auto-generate Salt
          </label>
        </div>

        {status && (
          <div className={`status-bar status-${status.type}`}>
            {status.type === "success" ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {status.msg}
          </div>
        )}

        <button
          className={`btn-primary ${loading ? "btn-loading" : ""}`}
          onClick={handleEncrypt}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" /> Encrypting...
            </>
          ) : (
            <>
              {" "}
              Encrypt Now <span className="btn-arrow">→</span>
            </>
          )}
        </button>

        {result && (
          <div className="result-block">
            <div className="result-header">
              <span className="result-label">Ciphertext</span>
              <div className="result-actions">
                <button
                  className="action-btn"
                  onClick={handleCopy}
                  title="Copy"
                >
                  {copied ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  className="action-btn"
                  onClick={handleDownload}
                  title="Download"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Save
                </button>
                <button
                  className="action-btn"
                  onClick={handleClear}
                  title="Clear"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                  Clear
                </button>
              </div>
            </div>
            <textarea
              className="result-textarea"
              value={result}
              readOnly
              rows={5}
            />
          </div>
        )}
      </div>

      <CryptoProcessSteps
        mode="encrypt"
        runSignal={processRun}
        completed={processCompleted}
      />
    </div>
  );
}
