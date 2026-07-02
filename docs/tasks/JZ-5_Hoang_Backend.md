# 🎫 Jira Task: JZ-5 — [Backend] Triển khai SSE Stream & Tích hợp Công thức Marketing (AIDA/PAS/BAB) cho AI Writer

*   **Assignee:** Le Van Hoang (DevOps Lead & Backend)
*   **Status:** TO DO
*   **Priority:** High
*   **Due Date:** 2026-07-02
*   **Epic Link:** Phase 7: AI Optimization
*   **Reference Spec:** [phase7_ai_optimization.md](file:///d:/ThucTapDN/Zeflyo/docs/phases/phase7_ai_optimization.md)

---

## 📖 Mô tả (Description)

Nâng cấp `GeminiService` và xây dựng API stream truyền dữ liệu theo thời gian thực (Server-Sent Events) cho tính năng AI Writer, tích hợp cơ chế tự động ngắt kết nối khi client hủy yêu cầu để tối ưu hóa chi phí API Token. Đồng thời tích hợp prompts cho 3 công thức Marketing kinh điển: AIDA, PAS, BAB theo hướng Value-First.

---

## 🛠️ Yêu cầu triển khai chi tiết (Implementation Requirements)

### 🔧 1. Nâng cấp `GeminiService` (`app/Services/GeminiService.php`)

*   **Chức năng**: Bổ sung hàm hỗ trợ stream dữ liệu từ Google Gemini API.
*   **API Endpoint đích của Google**:
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?key={API_KEY}`
*   **Kỹ thuật triển khai**:
    *   Sử dụng Laravel HTTP Client (`Http::withHeaders()->post(...)` hoặc curl trực tiếp nếu cần đọc stream chunk-by-chunk).
    *   Hàm khai báo: `public function generateReplyStream(array $messages, callable $onChunk): void`
    *   Trong hàm này, gọi Gemini API bằng stream mode. Mỗi khi nhận được chunk dữ liệu JSON từ Google, trích xuất text chunk và gọi:
        `$onChunk($textChunk);`
    *   Đảm bảo try-catch toàn bộ quá trình, ghi log lỗi chi tiết qua `Log::error` và trả về mã lỗi thích hợp để tránh làm crash ứng dụng khi API key lỗi hoặc quá hạn.

---

### 🔧 2. Xây dựng API Route `/api/posts/generate-ai-stream`

*   **Method**: `POST`
*   **Middleware**: `auth:sanctum` (Yêu cầu đăng nhập)
*   **Request Validation**:
    ```php
    $request->validate([
        'topic'       => 'required|string|max:1000',
        'goal'        => 'required|string|max:1000',
        'framework'   => 'required|in:aida,pas,bab',
        'tone'        => 'nullable|string|max:100',
        'post_length' => 'nullable|in:short,medium,long',
    ]);
    ```
*   **Rate Limiting**:
    *   Áp dụng rate limit riêng cho route này để tránh spam tiêu hao quota: tối đa **5 requests/phút** mỗi user. Trả về `429 Too Many Requests` kèm JSON chuẩn nếu vượt quá.
*   **Thiết lập Header phản hồi SSE & Vòng lặp Stream**:
    ```php
    return response()->stream(function () use ($request, $geminiService) {
        // Tắt giới hạn thời gian chạy của PHP script
        set_time_limit(0);
        
        $messages = $this->buildPrompts($request->all());
        
        $geminiService->generateReplyStream($messages, function ($chunk) {
            // Gửi dữ liệu về phía client theo đúng giao thức SSE
            echo "data: " . json_encode(['chunk' => $chunk]) . "\n\n";
            
            // Flush buffer ngay lập tức để đẩy dữ liệu về trình duyệt
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
            
            // --- Xử lý cơ chế Abort ở Bước 3 ---
            if (connection_aborted()) {
                Log::info("Client disconnected. Aborting Gemini streaming.");
                exit;
            }
        });
        
        // Báo hiệu kết thúc stream thành công
        echo "event: end\n";
        echo "data: " . json_encode(['status' => 'completed']) . "\n\n";
    }, 200, [
        'Content-Type' => 'text/event-stream',
        'Cache-Control' => 'no-cache',
        'Connection' => 'keep-alive',
        'X-Accel-Buffering' => 'no', // Quan trọng: Chặn Nginx proxy đệm dữ liệu
    ]);
    ```

---

### 🔧 3. Cơ chế Abort Token-Saving (Tiết kiệm chi phí API)

*   **Nguyên lý**: Khi client nhấn nút Hủy, kết nối TCP/HTTP sẽ bị đóng. PHP có thể phát hiện điều này thông qua hàm `connection_aborted()`.
*   **Đồng bộ**: 
    *   Hàm `connection_aborted()` chỉ hoạt động khi PHP cố gắng xuất (echo) dữ liệu ra và flush buffer. Do đó, logic check `connection_aborted()` phải được đặt ngay sau câu lệnh `flush()` như trong code ví dụ ở Mục 2.
    *   Khi phát hiện ngắt kết nối, phải gọi lệnh dừng xử lý hoặc ngắt request đến Gemini API trước khi gọi lệnh `exit;` để giải phóng tài nguyên.

---

### 🔧 4. Tích hợp Prompts chuẩn hóa (Value-First Principle)

Xây dựng hàm private `buildPrompts(array $data): array` để bọc input của user vào System Prompt chuyên dụng:

*   **Công thức AIDA**:
    *   *System Prompt*:
        "Bạn là chuyên gia viết bài quảng cáo Facebook theo công thức AIDA. Hãy viết bài viết theo cấu trúc:
        1. Attention (Thu hút): Mở đầu bằng một câu hỏi nhức nhối, một con số giật mình hoặc một tuyên bố mạnh mẽ.
        2. Interest (Thích thú): Trình bày các thông tin thú vị, hữu ích về giải pháp giúp độc giả tò mò.
        3. Desire (Khao khát): Tập trung vào LỢI ÍCH thực tế độc giả nhận được (giúp họ giải quyết vấn đề gì, tiết kiệm thời gian/tiền bạc ra sao). Hãy áp dụng nguyên tắc Value-First: Tặng voucher hoặc tài liệu bổ ích trước (chiếm 70% nội dung).
        4. Action (Hành động): Lời kêu gọi hành động (CTA) ngắn gọn, khẩn cấp kèm hotline hoặc link đăng ký rõ ràng (chiếm 30% nội dung)."
*   **Công thức PAS**:
    *   *System Prompt*:
        "Bạn là chuyên gia viết bài marketing Facebook theo công thức PAS. Hãy cấu trúc bài viết:
        1. Problem (Vấn đề): Nêu bật một vấn đề/nỗi đau thực tế, khó chịu mà khách hàng mục tiêu đang gặp phải.
        2. Agitate (Xoáy sâu): Phân tích hậu quả, sự phiền toái hoặc cảm xúc tiêu cực nếu vấn đề đó không được giải quyết ngay lập tức.
        3. Solve (Giải pháp): Giới thiệu sản phẩm/dịch vụ của shop như một giải pháp cứu cánh hoàn hảo, nhấn mạnh giá trị thực tế mang lại cho khách hàng."
*   **Công thức BAB**:
    *   *System Prompt*:
        "Bạn là chuyên gia viết bài kể chuyện marketing theo công thức BAB. Hãy cấu trúc bài viết:
        1. Before (Trước đây): Vẽ ra bức tranh đầy khó khăn, bất tiện hoặc thiếu thốn của khách hàng khi chưa có giải pháp.
        2. After (Sau này): Miêu tả cuộc sống dễ chịu, thành công, hạnh phúc của khách hàng sau khi giải quyết được vấn đề.
        3. Bridge (Cầu nối): Giới thiệu sản phẩm/dịch vụ chính là cầu nối mang lại sự chuyển đổi kỳ diệu đó."
*   *Định dạng chung*: Luôn yêu cầu Gemini tự động sinh các hashtags phù hợp ở cuối bài viết.

---

## ✅ Tiêu chí hoàn thành (DoD - Definition of Done)

*   [ ] API `/api/posts/generate-ai-stream` hoạt động đúng chuẩn SSE stream, trả về dữ liệu chunk-by-chunk.
*   [ ] Khi Client chủ động đóng kết nối (hủy request), Backend ngắt luồng gọi Gemini thành công (xác nhận qua log).
*   [ ] Validation đầu vào đầy đủ, chặn ký tự lạ và trả về mã lỗi 422 chuẩn.
*   [ ] Áp dụng Rate Limiting thành công (5 requests/phút).
*   [ ] Không hardcode API key, sử dụng cấu hình từ `.env`.
*   [ ] Mã nguồn PHP vượt qua kiểm tra static analysis (Larastan) và định dạng code style (`php artisan pint`).
