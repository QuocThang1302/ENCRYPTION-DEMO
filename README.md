# Encryption Demo - Giải thích thuật toán và các hàm quan trọng

## 1. Tổng quan
Ứng dụng này là demo mã hóa/giải mã dữ liệu trên client (trình duyệt) bằng Web Crypto API, gồm 3 nhóm chức năng:

1. Mã hóa/giải mã văn bản với AES-256-GCM.
2. Mã hóa/giải mã văn bản với Caesar (mục đích demo cơ bản).
3. Mã hóa/giải mã ảnh với AES-256-GCM.

Logic mã hóa nằm chủ yếu tại [src/crypto/encryptor.js](src/crypto/encryptor.js), còn giao diện và luồng sự kiện nằm trong các component React.

## 2. Kiến trúc chính

1. Lớp crypto:
   - [src/crypto/encryptor.js](src/crypto/encryptor.js)
2. UI văn bản:
   - [src/components/EncryptPanel.jsx](src/components/EncryptPanel.jsx)
   - [src/components/DecryptPanel.jsx](src/components/DecryptPanel.jsx)
3. UI ảnh:
   - [src/components/ImageCryptoPanel.jsx](src/components/ImageCryptoPanel.jsx)
4. Minh họa quy trình theo bước:
   - [src/components/CryptoProcessSteps.jsx](src/components/CryptoProcessSteps.jsx)
5. Layout tổng thể:
   - [src/App.jsx](src/App.jsx)

## 3. Thuật toán được sử dụng

### 3.1 AES-256-GCM (khuyến nghị)
AES-GCM cung cấp 2 thuộc tính quan trọng:

1. Bí mật (confidentiality): dữ liệu bị mã hóa.
2. Toàn vẹn/xác thực (integrity/authenticity): GCM tag phát hiện sửa đổi dữ liệu hoặc sai mật khẩu.

Thông số đang dùng trong code:

1. Độ dài khóa AES: 256 bit.
2. PBKDF2: 65536 vòng, SHA-256.
3. Salt: 16 byte.
4. IV GCM: 12 byte.
5. Tag length: 128 bit.

### 3.2 Caesar Cipher (chỉ để demo)
Caesar là thuật toán cổ điển, rất dễ bị tấn công, không phù hợp bảo mật thực tế. Ở đây dùng để minh họa ý tưởng mã hóa cơ bản.

Shift được tính từ mật khẩu:

1. Tổng mã ký tự của mật khẩu.
2. Lấy mod 26.
3. Cộng thêm 1.

## 4. Format dữ liệu mã hóa

### 4.1 Văn bản AES
`ENC$AES$<base64_salt>$<base64_iv>$<base64_ciphertext>`

### 4.2 Văn bản Caesar
`ENC$CAESAR$<shifted_text>`

### 4.3 Ảnh AES
`ENC$AESIMG$<base64_mime>$<base64_salt>$<base64_iv>$<base64_ciphertext>`

Ghi chú:

1. Prefix giúp nhận diện thuật toán khi giải mã.
2. MIME type của ảnh được lưu để khôi phục đúng định dạng file khi decrypt.

## 5. Các hàm quan trọng trong lớp crypto

Tất cả các hàm bên dưới nằm trong [src/crypto/encryptor.js](src/crypto/encryptor.js).

### 5.1 Nhóm helper

1. `randomBytes(size)`:
   - Sinh byte ngẫu nhiên bằng `crypto.getRandomValues`.
   - Dùng cho salt, IV.
2. `toBase64(buffer)` và `fromBase64(str)`:
   - Chuyển đổi bytes <-> base64.
   - Có xử lý theo chunk để tránh tràn stack khi dữ liệu lớn.
3. `encodeUtf8(str)` và `decodeUtf8(buffer)`:
   - Chuyển đổi string <-> Uint8Array theo UTF-8.

### 5.2 Dẫn xuất khóa

1. `deriveKey(password, salt)`:
   - Import mật khẩu raw.
   - Dùng PBKDF2 (SHA-256, 65536 vòng).
   - Trả về CryptoKey AES-GCM 256-bit.

### 5.3 Mã hóa/giải mã văn bản AES

1. `encryptAES(plainText, password)`:
   - Tạo salt + IV mới cho mỗi lần mã hóa.
   - Thêm marker `TXT:` trước plaintext để verify sau giải mã.
   - Mã hóa bằng AES-GCM.
   - Trả chuỗi theo format `ENC$AES$...`.
2. `decryptAES(encryptedText, password)`:
   - Validate prefix + cấu trúc chuỗi.
   - Parse salt/iv/ciphertext từ base64.
   - Derive key lại từ password.
   - Giải mã và kiểm tra marker `TXT:`.
   - Sai password hoặc dữ liệu hỏng sẽ throw error.

### 5.4 Caesar

1. `getShiftFromPassword(password)`:
   - Tạo shift trong khoảng 1..26.
2. `shiftText(text, shift)`:
   - Dịch chuyển ký tự alphabet, giữ nguyên ký tự khác.
3. `encryptCaesar(plainText, password)`:
   - Thêm marker `TXT:` rồi shift.
   - Gắn prefix `ENC$CAESAR$`.
4. `decryptCaesar(encryptedText, password)`:
   - Bỏ prefix.
   - Shift ngược.
   - Kiểm tra marker để phát hiện key sai.

### 5.5 Mã hóa/giải mã ảnh AES

1. `encryptImageAES(file, password)`:
   - Đọc binary từ `file.arrayBuffer()`.
   - Tạo salt + IV, derive key.
   - Mã hóa AES-GCM binary.
   - Đóng gói kèm MIME type vào prefix `ENC$AESIMG$...`.
2. `decryptImageAES(encryptedText, password)`:
   - Validate format `ENC$AESIMG$`.
   - Parse mime/salt/iv/cipher.
   - Giải mã binary.
   - Trả về `{ blob, mimeType }` để preview/download.

## 6. Các hàm UI quan trọng

### 6.1 Encrypt panel
File: [src/components/EncryptPanel.jsx](src/components/EncryptPanel.jsx)

1. `handleEncrypt()`:
   - Validate input + password.
   - Chọn `encryptAES` hoặc `encryptCaesar` theo algorithm.
   - Cập nhật trạng thái loading/status/result.
2. `handleCopy()`:
   - Copy ciphertext vào clipboard.
3. `handleDownload()`:
   - Tải ciphertext thành file txt.
4. `handleOpenFile()`:
   - Đọc plaintext từ file txt.
5. `handleClear()`:
   - Reset form và kết quả.

### 6.2 Decrypt panel
File: [src/components/DecryptPanel.jsx](src/components/DecryptPanel.jsx)

1. `detectAlgorithm(text)`:
   - Nhận diện prefix `ENC$AES$` hoặc `ENC$CAESAR$`.
2. `handleDecrypt()`:
   - Validate input + password + format.
   - Tự động chọn `decryptAES` hoặc `decryptCaesar`.
   - Hiển thị kết quả plaintext.
3. `handleCopy()`, `handleDownload()`, `handleOpenFile()`, `handleClear()`:
   - Tương tự panel Encrypt.

### 6.3 Image panel
File: [src/components/ImageCryptoPanel.jsx](src/components/ImageCryptoPanel.jsx)

1. `handleSelectImage()`:
   - Validate file là image.
   - Tạo preview.
2. `handleEncryptImage()`:
   - Gọi `encryptImageAES`.
   - Trả ciphertext ảnh dạng text.
3. `handleDecryptImage()`:
   - Gọi `decryptImageAES`.
   - Tạo object URL để preview ảnh đã giải mã.
4. `downloadImage()`:
   - Chọn extension dựa trên MIME.
5. `clearOutputs()` và `clearAll()`:
   - Thu hồi object URL cũ (tránh memory leak).

### 6.4 Step-by-step animation
File: [src/components/CryptoProcessSteps.jsx](src/components/CryptoProcessSteps.jsx)

1. Props `mode`:
   - Chọn bộ bước Encrypt hoặc Decrypt.
2. Props `runSignal`:
   - Tăng giá trị khi user bấm nút Encrypt/Decrypt.
   - Trigger timeline chạy theo hành động thật (không auto-loop).
3. Props `completed`:
   - Đánh dấu quy trình đã thành công.
4. Có hình minh họa SVG:
   - [src/assets/crypto-illustration.svg](src/assets/crypto-illustration.svg)

## 7. Luồng xử lý tổng quát

### 7.1 Mã hóa văn bản AES
1. User nhập plaintext + password.
2. Sinh salt/iv ngẫu nhiên.
3. Derive key PBKDF2.
4. Encrypt AES-GCM.
5. Trả chuỗi `ENC$AES$...`.

### 7.2 Giải mã văn bản AES
1. User nhập ciphertext + password.
2. Parse salt/iv/ciphertext.
3. Derive key PBKDF2.
4. Decrypt AES-GCM.
5. Check marker `TXT:` và trả plaintext.

### 7.3 Mã hóa/giải mã ảnh
1. Encrypt: file -> ArrayBuffer -> AES-GCM -> chuỗi `ENC$AESIMG$...`.
2. Decrypt: chuỗi `ENC$AESIMG$...` -> Blob -> preview/download.

## 8. Lưu ý bảo mật và giới hạn

1. Caesar không an toàn cho production.
2. Đây là mã hóa phía client, key nằm trên trình duyệt.
3. Không tự động lưu key, user phải tự quản lý key.
4. Mất key hoặc nhập sai key sẽ không thể khôi phục dữ liệu.

## 9. Mở rộng đề xuất

1. Thêm version field vào prefix để dễ migrate format sau này.
2. Thêm checksum metadata cho payload ảnh nếu cần debug file lỗi.
3. Hỗ trợ export định dạng binary `.enc` bên cạnh text payload.
4. Thêm test tự động cho parser format và case lỗi (invalid prefix, wrong password, corrupted base64).
