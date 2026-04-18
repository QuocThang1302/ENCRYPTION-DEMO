import React, { useEffect, useState } from "react";
import cryptoIllustration from "../assets/crypto-illustration.svg";

const PROCESS_STEPS = {
  encrypt: [
    {
      title: "Nhập dữ liệu gốc",
      desc: "Plaintext hoặc dữ liệu đầu vào được đưa vào hệ thống.",
    },
    {
      title: "Sinh Salt + IV",
      desc: "Hệ thống tạo Salt và IV ngẫu nhiên cho phiên mã hóa.",
    },
    {
      title: "Dẫn xuất khóa PBKDF2",
      desc: "Khóa bí mật được tạo từ mật khẩu với SHA-256.",
    },
    {
      title: "Mã hóa AES-GCM",
      desc: "Dữ liệu được mã hóa và gắn thẻ xác thực toàn vẹn.",
    },
    {
      title: "Xuất Ciphertext",
      desc: "Trả về chuỗi ENC$... để sao chép hoặc lưu trữ.",
    },
  ],
  decrypt: [
    {
      title: "Nhập Ciphertext",
      desc: "Nhận chuỗi ENC$... đã được mã hóa trước đó.",
    },
    {
      title: "Tách Salt + IV",
      desc: "Đọc metadata phiên mã hóa từ ciphertext.",
    },
    {
      title: "Dẫn xuất khóa PBKDF2",
      desc: "Tái tạo khóa từ mật khẩu người dùng.",
    },
    {
      title: "Giải mã AES-GCM",
      desc: "Giải mã và xác minh tính toàn vẹn dữ liệu.",
    },
    {
      title: "Khôi phục Plaintext",
      desc: "Hiển thị dữ liệu gốc cho người dùng.",
    },
  ],
};

export default function CryptoProcessSteps({
  mode = "encrypt",
  runSignal = 0,
  completed = false,
}) {
  const steps = PROCESS_STEPS[mode] || PROCESS_STEPS.encrypt;
  const [activeStep, setActiveStep] = useState(-1);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!runSignal) {
      setActiveStep(-1);
      setIsCompleted(false);
      return;
    }

    setActiveStep(0);
    setIsCompleted(false);

    let stepIndex = 0;
    const timer = setInterval(() => {
      stepIndex += 1;
      if (stepIndex >= steps.length) {
        clearInterval(timer);
        return;
      }
      setActiveStep(stepIndex);
    }, 700);

    return () => clearInterval(timer);
  }, [runSignal, steps.length]);

  useEffect(() => {
    if (!completed || !runSignal) return;
    setIsCompleted(true);
    setActiveStep(steps.length - 1);
  }, [completed, runSignal, steps.length]);

  const chipLabel = isCompleted
    ? "Completed"
    : runSignal
      ? "Running"
      : "Click to start";

  return (
    <aside className="process-visual" aria-label="Process visualization">
      <div className="process-illustration-wrap">
        <img
          src={cryptoIllustration}
          alt="Minh hoa luong ma hoa va giai ma"
          className="process-illustration"
        />
      </div>

      <div className="process-head">
        <p className="process-title">
          {mode === "encrypt" ? "Encryption Flow" : "Decryption Flow"}
        </p>
        <span className="process-chip">{chipLabel}</span>
      </div>

      <div className="process-timeline">
        {steps.map((step, index) => {
          let state = "idle";
          if (isCompleted) {
            state = "done";
          } else if (activeStep >= 0) {
            state =
              index < activeStep
                ? "done"
                : index === activeStep
                  ? "active"
                  : "idle";
          }

          return (
            <div key={step.title} className={`process-step step-${state}`}>
              <div className="process-index">{index + 1}</div>
              <div className="process-body">
                <p className="process-step-title">{step.title}</p>
                <p className="process-step-desc">{step.desc}</p>
              </div>
              {state === "active" && (
                <span className="process-pulse" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
