import React from "react";

const helperSnippet = `function randomBytes(size) {
  return crypto.getRandomValues(new Uint8Array(size));
}

function toBase64(buffer) {
  return btoa(uint8ToBinaryString(new Uint8Array(buffer)));
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

function encodeUtf8(str) {
  return new TextEncoder().encode(str);
}

function decodeUtf8(buffer) {
  return new TextDecoder().decode(buffer);
}`;

const deriveKeySnippet = `async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encodeUtf8(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 65536,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}`;

const aesSnippet = `export async function encryptAES(plainText, password) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const secretKey = await deriveKey(password, salt);
  const plainBytes = encodeUtf8("TXT:" + plainText);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    secretKey,
    plainBytes,
  );

  return "ENC$AES$" + toBase64(salt) + "$" + toBase64(iv) + "$" + toBase64(cipherBuffer);
}

export async function decryptAES(encryptedText, password) {
  if (!encryptedText.startsWith("ENC$AES$")) {
    throw new Error("Dữ liệu không đúng định dạng AES.");
  }

  const parts = encryptedText.split("$");
  if (parts.length !== 5) {
    throw new Error("Dữ liệu AES không hợp lệ.");
  }

  const salt = fromBase64(parts[2]);
  const iv = fromBase64(parts[3]);
  const cipherBytes = fromBase64(parts[4]);
  const secretKey = await deriveKey(password, salt);

  let decryptedBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      secretKey,
      cipherBytes,
    );
  } catch {
    throw new Error("Sai mật khẩu hoặc dữ liệu bị hỏng.");
  }

  const decrypted = decodeUtf8(decryptedBuffer);
  if (!decrypted.startsWith("TXT:")) {
    throw new Error("Dữ liệu giải mã không hợp lệ.");
  }

  return decrypted.substring(4);
}`;

const caesarSnippet = `function getShiftFromPassword(password) {
  let sum = 0;
  for (const c of password) {
    sum += c.charCodeAt(0);
  }
  return (sum % 26) + 1;
}

function shiftText(text, shift) {
  let result = "";
  for (const c of text) {
    const code = c.charCodeAt(0);
    if (c >= "A" && c <= "Z") {
      result += String.fromCharCode(65 + ((((code - 65 + shift) % 26) + 26) % 26));
    } else if (c >= "a" && c <= "z") {
      result += String.fromCharCode(97 + ((((code - 97 + shift) % 26) + 26) % 26));
    } else {
      result += c;
    }
  }
  return result;
}

export function encryptCaesar(plainText, password) {
  const shift = getShiftFromPassword(password);
  const preparedText = "TXT:" + plainText;
  return "ENC$CAESAR$" + shiftText(preparedText, shift);
}

export function decryptCaesar(encryptedText, password) {
  if (!encryptedText.startsWith("ENC$CAESAR$")) {
    throw new Error("Dữ liệu không đúng định dạng Caesar.");
  }

  const shift = getShiftFromPassword(password);
  const cipherText = encryptedText.substring("ENC$CAESAR$".length);
  const decrypted = shiftText(cipherText, -shift);

  if (!decrypted.startsWith("TXT:")) {
    throw new Error("Key không đúng hoặc dữ liệu Caesar không hợp lệ.");
  }

  return decrypted.substring(4);
}`;

const imageAesSnippet = `export async function encryptImageAES(file, password) {
  const buffer = await file.arrayBuffer();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const secretKey = await deriveKey(password, salt);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    secretKey,
    buffer,
  );

  const mime = file.type || "application/octet-stream";
  return (
    "ENC$AESIMG$" +
    toBase64(encodeUtf8(mime)) +
    "$" +
    toBase64(salt) +
    "$" +
    toBase64(iv) +
    "$" +
    toBase64(cipherBuffer)
  );
}

export async function decryptImageAES(encryptedText, password) {
  if (!encryptedText.startsWith("ENC$AESIMG$")) {
    throw new Error("Dữ liệu không đúng định dạng ảnh AES.");
  }

  const parts = encryptedText.split("$");
  if (parts.length !== 6) {
    throw new Error("Dữ liệu ảnh AES không hợp lệ.");
  }

  const mimeType = decodeUtf8(fromBase64(parts[2])) || "application/octet-stream";
  const salt = fromBase64(parts[3]);
  const iv = fromBase64(parts[4]);
  const cipherBytes = fromBase64(parts[5]);
  const secretKey = await deriveKey(password, salt);

  let decryptedBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      secretKey,
      cipherBytes,
    );
  } catch {
    throw new Error("Sai mật khẩu hoặc dữ liệu ảnh bị hỏng.");
  }

  const blob = new Blob([decryptedBuffer], { type: mimeType });
  return { blob, mimeType };
}`;

const dataFormatSnippet = `4.1. Văn bản mã hóa bằng AES
ENC$AES$<base64_salt>$<base64_iv>$<base64_ciphertext>

4.2. Văn bản mã hóa bằng Caesar
ENC$CAESAR$<shifted_text>

4.3. Ảnh mã hóa bằng AES
ENC$AESIMG$<base64_mime>$<base64_salt>$<base64_iv>$<base64_ciphertext>`;

export default function CryptoExplainPanel() {
  return (
    <section className="panel explain-panel">
      <div className="panel-header">
        <div className="panel-icon encrypt-icon">
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
            <path d="M4 4h16v16H4z" />
            <path d="M9 9h6v6H9z" />
          </svg>
        </div>
        <h2 className="panel-title">5. Các hàm quan trọng trong lớp mã hóa</h2>
      </div>

      <p className="explain-intro">
        Toàn bộ các hàm bên dưới được cài đặt trong
        <span className="inline-code"> src/crypto/encryptor.js</span>. Tab này
        giúp nhìn nhanh vai trò từng hàm và xem code mẫu trực tiếp.
      </p>

      <article className="explain-section">
        <h3>4. Định dạng dữ liệu sau khi mã hóa</h3>
        <p>
          Để thuận tiện cho việc nhận diện và giải mã, ứng dụng dùng định dạng
          chuỗi có prefix riêng cho từng loại dữ liệu.
        </p>
        <pre className="code-block">
          <code>{dataFormatSnippet}</code>
        </pre>
        <ul>
          <li>
            Prefix giúp hệ thống xác định đúng thuật toán cần dùng khi giải mã.
          </li>
          <li>
            Với dữ liệu ảnh, MIME type được lưu kèm để khôi phục đúng định dạng
            file ban đầu sau khi giải mã.
          </li>
        </ul>
      </article>

      <article className="explain-section">
        <h3>5.1. Nhóm hàm hỗ trợ</h3>
        <ul>
          <li>
            <strong>randomBytes(size)</strong>: Sinh dãy byte ngẫu nhiên bằng
            crypto.getRandomValues để tạo salt và IV.
          </li>
          <li>
            <strong>toBase64(buffer)</strong> và{" "}
            <strong>fromBase64(str)</strong>: Chuyển đổi giữa dữ liệu nhị phân
            và chuỗi base64.
          </li>
          <li>
            <strong>encodeUtf8(str)</strong> và{" "}
            <strong>decodeUtf8(buffer)</strong>: Chuyển đổi qua lại giữa chuỗi
            và Uint8Array theo UTF-8.
          </li>
        </ul>
        <pre className="code-block">
          <code>{helperSnippet}</code>
        </pre>
      </article>

      <article className="explain-section">
        <h3>5.2. Hàm dẫn xuất khóa</h3>
        <p>
          <strong>deriveKey(password, salt)</strong> nhận mật khẩu người dùng,
          import ở dạng raw key, sau đó dùng PBKDF2 với SHA-256 và 65536 vòng để
          sinh CryptoKey cho AES-GCM 256-bit.
        </p>
        <pre className="code-block">
          <code>{deriveKeySnippet}</code>
        </pre>
      </article>

      <article className="explain-section">
        <h3>5.3. Mã hóa và giải mã văn bản bằng AES</h3>
        <ul>
          <li>
            <strong>encryptAES(plainText, password)</strong>: Tạo salt/IV mới,
            thêm marker TXT:, mã hóa AES-GCM, trả về chuỗi ENC$AES$....
          </li>
          <li>
            <strong>decryptAES(encryptedText, password)</strong>: Kiểm tra
            prefix/cấu trúc, parse salt-IV-cipher, dẫn xuất lại khóa, giải mã,
            rồi kiểm tra marker TXT:.
          </li>
          <li>
            Nếu mật khẩu sai hoặc dữ liệu hỏng, hàm sẽ throw error để UI báo lỗi
            ngay cho người dùng.
          </li>
        </ul>
        <pre className="code-block">
          <code>{aesSnippet}</code>
        </pre>
      </article>

      <article className="explain-section">
        <h3>5.4. Mã hóa và giải mã bằng Caesar</h3>
        <ul>
          <li>
            <strong>getShiftFromPassword(password)</strong>: Tạo shift từ mật
            khẩu trong khoảng từ 1 đến 26.
          </li>
          <li>
            <strong>shiftText(text, shift)</strong>: Dịch chuyển ký tự alphabet
            theo số bước, giữ nguyên số, dấu cách và dấu câu.
          </li>
          <li>
            <strong>encryptCaesar(plainText, password)</strong>: Thêm marker
            TXT:, dịch chuyển ký tự, rồi gắn prefix ENC$CAESAR$.
          </li>
          <li>
            <strong>decryptCaesar(encryptedText, password)</strong>: Bỏ prefix,
            dịch chuyển ngược, rồi kiểm tra marker để phát hiện sai khóa.
          </li>
        </ul>
        <pre className="code-block">
          <code>{caesarSnippet}</code>
        </pre>
      </article>

      <article className="explain-section">
        <h3>5.5. Mã hóa và giải mã ảnh bằng AES</h3>
        <ul>
          <li>
            <strong>encryptImageAES(file, password)</strong>: Đọc dữ liệu nhị
            phân từ file.arrayBuffer(), tạo salt và IV, dẫn xuất khóa, mã hóa
            ảnh bằng AES-GCM, đóng gói thêm MIME type và trả về chuỗi
            ENC$AESIMG$....
          </li>
          <li>
            <strong>decryptImageAES(encryptedText, password)</strong>: Kiểm tra
            định dạng ENC$AESIMG$, tách MIME type, salt, IV và ciphertext, giải
            mã dữ liệu ảnh, sau đó trả về đối tượng {`{ blob, mimeType }`}.
          </li>
        </ul>
        <pre className="code-block">
          <code>{imageAesSnippet}</code>
        </pre>
      </article>
    </section>
  );
}
