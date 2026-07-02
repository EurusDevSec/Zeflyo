# 🎫 Jira Task: JZ-6 — [Frontend] Tái thiết kế UI AI Writer: visual cards công thức, Prompt Chips, SSE typing effect và nút Hủy

*   **Assignee:** Ha Dang Khoa (Security Lead & Frontend)
*   **Status:** TO DO
*   **Priority:** High
*   **Due Date:** 2026-07-02
*   **Epic Link:** Phase 7: AI Optimization
*   **Reference Spec:** [phase7_ai_optimization.md](file:///d:/ThucTapDN/Zeflyo/docs/phases/phase7_ai_optimization.md)

---

## 📖 Mô tả (Description)

Cải tiến giao diện tab "Tạo bài AI" trên trang Lên lịch đăng bài `/scheduler` theo hướng tinh giản, hiển thị 3 Card chọn công thức trực quan, gợi ý chủ đề bằng Prompt Chips, kết nối API stream hiển thị chữ chạy (typing effect) và tích hợp cơ chế hủy yêu cầu bằng AbortController.

---

## 🛠️ Yêu cầu triển khai chi tiết (Implementation Requirements)

### 🎨 1. Tinh giản Giao diện nhập liệu & Card chọn Công thức

*   **Tinh giản UI**: Ẩn các cấu hình nâng cao rườm rà (Temperature, Max tokens, Top-P, v.v.). Giữ lại form nhập liệu cơ bản:
    *   **Input Chủ đề**: Ô nhập chủ đề bài đăng.
    *   **Input Mục tiêu**: Ô nhập mục tiêu bài viết.
*   **3 Visual Cards chọn Công thức**: Thiết kế 3 card dạng lưới:
    *   `⚡ Công thức Thuyết phục (AIDA)`: Hover/active hiển thị viền tím sáng (`#6C63FF`) và bóng mờ.
    *   `🔥 Công thức Đồng cảm (PAS)`: Hover/active hiển thị viền cam/đỏ sáng (`#EF4444`) và bóng mờ.
    *   `🌟 Công thức Kể chuyện (BAB)`: Hover/active hiển thị viền xanh dương sáng (`#3B82F6`) và bóng mờ.
    *   Card không được chọn sẽ mờ đi (`opacity-60`).

---

### 🎨 2. Tích hợp Prompt Chips (Gợi ý chủ đề nhanh)

*   **Hiển thị**: Đặt ngay phía trên ô nhập Chủ đề. Danh sách các badge nhỏ (pill badges) có hiệu ứng chuyển động nhẹ (micro-animations) khi hover:
    *   `🎁 Tặng quà Minigame`
    *   `💡 Mẹo vặt thời trang`
    *   `🔥 Sale sập sàn 50%`
    *   `📖 Kể chuyện khởi nghiệp`
*   **Hành vi**: Khi click vào Prompt Chip, tự động điền văn bản mẫu phù hợp vào ô Chủ đề và Mục tiêu bài viết.

---

### 📡 3. Kết nối Stream SSE & Hiệu ứng Typing Effect (Đồng bộ với JZ-5)

*   **API Endpoint**: `/api/posts/generate-ai-stream` (POST)
*   **JSON Payload gửi lên**:
    ```json
    {
      "topic": "Chủ đề người dùng nhập",
      "goal": "Mục tiêu người dùng nhập",
      "framework": "aida", // "aida" | "pas" | "bab"
      "tone": "Thân thiện", // Mặc định
      "post_length": "medium" // Mặc định
    }
    ```
*   **Đọc dữ liệu stream (Ví dụ mẫu code cho React)**:
    ```typescript
    const controller = new AbortController();
    setAbortController(controller);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/posts/generate-ai-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic, goal, framework, tone, post_length }),
        signal: controller.signal
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) return;

      let partialLine = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunk).split("\n");
        partialLine = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.chunk) {
                  // Cộng dồn chữ vào bài đăng (hiệu ứng typing)
                  setPostContent(prev => prev + parsed.chunk);
                }
              } catch (e) {
                // Bỏ qua lỗi parse dòng cuối hoặc event kết thúc
              }
            }
          } else if (line.startsWith("event: end")) {
            // Nhận tín hiệu kết thúc từ backend
            setIsStreaming(false);
            break;
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("Fetch aborted by client");
      } else {
        showToast("Có lỗi xảy ra khi tạo bài.");
      }
    } finally {
      setIsStreaming(false);
    }
    ```

---

### 🛑 4. Nút Hủy viết bài (Abort Stream)

*   **UI nút bấm**: Khi `isStreaming === true`, nút **[✍️ Bắt đầu viết bằng AI]** chuyển thành nút **[🛑 Hủy viết bài]** màu đỏ nhấp nháy (pulse animation).
*   **Logic Abort**:
    *   Khi click nút **[🛑 Hủy viết bài]**:
        *   Gọi `abortController.abort()` để ngắt kết nối HTTP ngay lập tức.
        *   Reset trạng thái UI về bình thường, đặt `isStreaming` thành `false` và hiển thị Toast: *"Đã dừng tạo bài viết."*

---

## ✅ Tiêu chí hoàn thành (DoD - Definition of Done)

*   [ ] Giao diện tab "Tạo bài AI" responsive chuẩn trên mobile/tablet/desktop.
*   [ ] Click Prompt Chips tự điền dữ liệu mẫu thành công.
*   [ ] SSE stream hoạt động ổn định, hiển thị typing effect chuẩn xác.
*   [ ] Bấm nút Hủy ngắt request HTTP lập tức (Network hiển thị trạng thái `Canceled` cho request).
*   [ ] Không phát sinh lỗi TypeScript khi chạy lệnh biên dịch `npx tsc --noEmit`.
*   [ ] Build production dự án thành công (`npm run build`).
