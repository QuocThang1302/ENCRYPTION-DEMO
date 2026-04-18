/**
 * encryptor.js
 *
 * Re-implementation of TextEncryptorApp.java logic using the Web Crypto API.
 * Output format is 100% compatible with the original Java application:
 *
 *   AES:    ENC$AES$<base64_salt>$<base64_iv>$<base64_ciphertext>
 *   Caesar: ENC$CAESAR$<shifted_text>
 *
 * Constants mirror Java exactly:
 *   AES_KEY_LENGTH    = 256
 *   PBKDF2_ITERATIONS = 65536
 *   GCM_TAG_LENGTH    = 128 bits
 *   GCM_IV_LENGTH     = 12 bytes
 *   SALT_LENGTH       = 16 bytes
 *   TEXT_MARKER       = "TXT:"
 */

const AES_PREFIX = "ENC$AES$";
const CAESAR_PREFIX = "ENC$CAESAR$";
const AES_IMAGE_PREFIX = "ENC$AESIMG$";
const TEXT_MARKER = "TXT:";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomBytes(size) {
  return crypto.getRandomValues(new Uint8Array(size));
}

function uint8ToBinaryString(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return binary;
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
}

// ─── PBKDF2 key derivation (mirrors Java deriveKey) ──────────────────────────

async function deriveKey(password, salt) {
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
      salt: salt,
      iterations: 65536, // PBKDF2_ITERATIONS
      hash: "SHA-256", // PBKDF2WithHmacSHA256
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 }, // AES_KEY_LENGTH
    false,
    ["encrypt", "decrypt"],
  );
}

// ─── AES-256-GCM encrypt (mirrors Java encryptAES) ───────────────────────────

export async function encryptAES(plainText, password) {
  const salt = randomBytes(16); // SALT_LENGTH
  const iv = randomBytes(12); // GCM_IV_LENGTH

  const secretKey = await deriveKey(password, salt);

  // Java prepends TEXT_MARKER before encrypting
  const plainBytes = encodeUtf8(TEXT_MARKER + plainText);

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128, // GCM_TAG_LENGTH
    },
    secretKey,
    plainBytes,
  );

  // Format: ENC$AES$<salt>$<iv>$<ciphertext>
  return (
    AES_PREFIX +
    toBase64(salt) +
    "$" +
    toBase64(iv) +
    "$" +
    toBase64(cipherBuffer)
  );
}

// ─── AES-256-GCM decrypt (mirrors Java decryptAES) ───────────────────────────

export async function decryptAES(encryptedText, password) {
  if (!encryptedText.startsWith(AES_PREFIX)) {
    throw new Error("Dữ liệu không đúng định dạng AES.");
  }

  const parts = encryptedText.split("$");
  // ENC $ AES $ <salt> $ <iv> $ <cipher>  → 5 parts
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

  if (!decrypted.startsWith(TEXT_MARKER)) {
    throw new Error("Dữ liệu giải mã không hợp lệ.");
  }

  return decrypted.substring(TEXT_MARKER.length);
}

// ─── Caesar cipher (mirrors Java encryptCaesar / decryptCaesar) ──────────────

function getShiftFromPassword(password) {
  // Exact mirror of Java: sum of char codes mod 26, then +1
  let sum = 0;
  for (const c of password) {
    sum += c.charCodeAt(0);
  }
  return (sum % 26) + 1;
}

function shiftText(text, shift) {
  // Exact mirror of Java shiftText using Math.floorMod equivalent
  let result = "";
  for (const c of text) {
    const code = c.charCodeAt(0);
    if (c >= "A" && c <= "Z") {
      result += String.fromCharCode(
        65 + ((((code - 65 + shift) % 26) + 26) % 26),
      );
    } else if (c >= "a" && c <= "z") {
      result += String.fromCharCode(
        97 + ((((code - 97 + shift) % 26) + 26) % 26),
      );
    } else {
      result += c;
    }
  }
  return result;
}

export function encryptCaesar(plainText, password) {
  const shift = getShiftFromPassword(password);
  const preparedText = TEXT_MARKER + plainText;
  const encrypted = shiftText(preparedText, shift);
  return CAESAR_PREFIX + encrypted;
}

export function decryptCaesar(encryptedText, password) {
  if (!encryptedText.startsWith(CAESAR_PREFIX)) {
    throw new Error("Dữ liệu không đúng định dạng Caesar.");
  }

  const shift = getShiftFromPassword(password);
  const cipherText = encryptedText.substring(CAESAR_PREFIX.length);
  const decrypted = shiftText(cipherText, -shift);

  if (!decrypted.startsWith(TEXT_MARKER)) {
    throw new Error("Key không đúng hoặc dữ liệu Caesar không hợp lệ.");
  }

  return decrypted.substring(TEXT_MARKER.length);
}

// ─── AES image encrypt/decrypt ───────────────────────────────────────────────

export async function encryptImageAES(file, password) {
  const buffer = await file.arrayBuffer();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const secretKey = await deriveKey(password, salt);

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    secretKey,
    buffer,
  );

  const mime = file.type || "application/octet-stream";
  return (
    AES_IMAGE_PREFIX +
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
  if (!encryptedText.startsWith(AES_IMAGE_PREFIX)) {
    throw new Error("Dữ liệu không đúng định dạng ảnh AES.");
  }

  const parts = encryptedText.split("$");
  // ENC $ AESIMG $ <mime> $ <salt> $ <iv> $ <cipher> -> 6 parts
  if (parts.length !== 6) {
    throw new Error("Dữ liệu ảnh AES không hợp lệ.");
  }

  const mimeType =
    decodeUtf8(fromBase64(parts[2])) || "application/octet-stream";
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
}
