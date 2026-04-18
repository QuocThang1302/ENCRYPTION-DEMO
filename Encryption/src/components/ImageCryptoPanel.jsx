import React, { useMemo, useState } from "react";
import { decryptImageAES, encryptImageAES } from "../crypto/encryptor";

export default function ImageCryptoPanel() {
  const [mode, setMode] = useState("encrypt");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [encryptedText, setEncryptedText] = useState("");

  const [resultCipher, setResultCipher] = useState("");
  const [decryptedUrl, setDecryptedUrl] = useState("");
  const [decryptedBlob, setDecryptedBlob] = useState(null);
  const [decryptedMime, setDecryptedMime] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedPreview = useMemo(() => {
    if (!selectedFile) return "";
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  const clearOutputs = () => {
    setResultCipher("");
    setStatus(null);
    setEncryptedText("");

    if (decryptedUrl) {
      URL.revokeObjectURL(decryptedUrl);
    }
    setDecryptedUrl("");
    setDecryptedBlob(null);
    setDecryptedMime("");
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    clearOutputs();
    setSelectedFile(null);
    setMode(nextMode);
  };

  const handleSelectImage = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus({
        type: "error",
        msg: "Vui lòng chọn file ảnh (png, jpg, webp, ...).",
      });
      return;
    }

    clearOutputs();
    setSelectedFile(file);
    setStatus({ type: "success", msg: `Đã chọn ảnh: ${file.name}` });
  };

  const handleEncryptImage = async () => {
    if (!selectedFile) {
      setStatus({ type: "error", msg: "Vui lòng chọn ảnh trước khi mã hóa." });
      return;
    }
    if (!password) {
      setStatus({ type: "error", msg: "Vui lòng nhập mật khẩu / key." });
      return;
    }

    setLoading(true);
    setStatus(null);
    setResultCipher("");

    try {
      const encrypted = await encryptImageAES(selectedFile, password);
      setResultCipher(encrypted);
      setStatus({ type: "success", msg: "Mã hóa ảnh thành công!" });
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptImage = async () => {
    const trimmed = encryptedText.trim();

    if (!trimmed) {
      setStatus({ type: "error", msg: "Vui lòng dán chuỗi ảnh đã mã hóa." });
      return;
    }
    if (!password) {
      setStatus({ type: "error", msg: "Vui lòng nhập mật khẩu / key." });
      return;
    }

    setLoading(true);
    setStatus(null);

    if (decryptedUrl) {
      URL.revokeObjectURL(decryptedUrl);
    }
    setDecryptedUrl("");
    setDecryptedBlob(null);
    setDecryptedMime("");

    try {
      const { blob, mimeType } = await decryptImageAES(trimmed, password);
      const url = URL.createObjectURL(blob);
      setDecryptedUrl(url);
      setDecryptedBlob(blob);
      setDecryptedMime(mimeType);
      setStatus({ type: "success", msg: "Giải mã ảnh thành công!" });
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultCipher) return;
    navigator.clipboard.writeText(resultCipher).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadText = () => {
    if (!resultCipher) return;
    const blob = new Blob([resultCipher], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encrypted_image.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEncryptedFile = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setEncryptedText(ev.target.result);
    reader.readAsText(file, "UTF-8");
  };

  const downloadImage = () => {
    if (!decryptedBlob || !decryptedUrl) return;
    const extMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "image/bmp": "bmp",
      "image/svg+xml": "svg",
    };
    const ext = extMap[decryptedMime] || "img";
    const a = document.createElement("a");
    a.href = decryptedUrl;
    a.download = `decrypted_image.${ext}`;
    a.click();
  };

  const clearAll = () => {
    setSelectedFile(null);
    setPassword("");
    setStatus(null);
    setResultCipher("");
    setEncryptedText("");
    if (decryptedUrl) {
      URL.revokeObjectURL(decryptedUrl);
    }
    setDecryptedUrl("");
    setDecryptedBlob(null);
    setDecryptedMime("");
  };

  return (
    <div className="panel">
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
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </span>
        <h2 className="panel-title">Image Encrypt / Decrypt</h2>
      </div>

      <div className="tab-mini">
        <button
          type="button"
          className={`tab-mini-btn ${mode === "encrypt" ? "active" : ""}`}
          onClick={() => handleModeChange("encrypt")}
        >
          Encrypt Image
        </button>
        <button
          type="button"
          className={`tab-mini-btn ${mode === "decrypt" ? "active" : ""}`}
          onClick={() => handleModeChange("decrypt")}
        >
          Decrypt Image
        </button>
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

      {mode === "encrypt" && (
        <>
          <div className="field-group">
            <label className="field-label">Input Image</label>
            <label className="file-btn" title="Open image file">
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
              Open Image
              <input
                type="file"
                accept="image/*"
                onChange={handleSelectImage}
                style={{ display: "none" }}
              />
            </label>

            {selectedPreview && (
              <div className="image-preview-wrap">
                <img
                  src={selectedPreview}
                  alt="Selected preview"
                  className="image-preview"
                />
              </div>
            )}
          </div>

          <button
            className={`btn-primary ${loading ? "btn-loading" : ""}`}
            onClick={handleEncryptImage}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Encrypting image...
              </>
            ) : (
              <>
                Encrypt Image <span className="btn-arrow">→</span>
              </>
            )}
          </button>

          {resultCipher && (
            <div className="result-block">
              <div className="result-header">
                <span className="result-label">Encrypted Image Text</span>
                <div className="result-actions">
                  <button
                    className="action-btn"
                    onClick={handleCopy}
                    title="Copy"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    className="action-btn"
                    onClick={downloadText}
                    title="Download"
                  >
                    Save
                  </button>
                </div>
              </div>
              <textarea
                className="result-textarea"
                value={resultCipher}
                readOnly
                rows={4}
              />
            </div>
          )}
        </>
      )}

      {mode === "decrypt" && (
        <>
          <div className="field-group">
            <label className="field-label">Encrypted Image Data</label>
            <textarea
              className="field-textarea mono"
              placeholder="Paste ENC$AESIMG$... here"
              value={encryptedText}
              onChange={(e) => setEncryptedText(e.target.value)}
              rows={5}
            />
            <label className="file-btn" title="Open text file">
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
                onChange={openEncryptedFile}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <button
            className={`btn-secondary ${loading ? "btn-loading" : ""}`}
            onClick={handleDecryptImage}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner spinner-dark" /> Decrypting image...
              </>
            ) : (
              "Decrypt Image"
            )}
          </button>

          {decryptedUrl && (
            <div className="result-block">
              <div className="result-header">
                <span className="result-label">Decrypted Image Preview</span>
                <div className="result-actions">
                  <button className="action-btn" onClick={downloadImage}>
                    Download
                  </button>
                </div>
              </div>
              <div className="image-preview-wrap">
                <img
                  src={decryptedUrl}
                  alt="Decrypted preview"
                  className="image-preview"
                />
              </div>
            </div>
          )}
        </>
      )}

      {status && (
        <div className={`status-bar status-${status.type}`}>{status.msg}</div>
      )}

      <button
        className="action-btn"
        onClick={clearAll}
        style={{ alignSelf: "flex-end" }}
      >
        Clear All
      </button>
    </div>
  );
}
