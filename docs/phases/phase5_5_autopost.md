# Phase 5.5: Hệ Thống Đăng Bài Tự Động với AI (AutoWork-Level)

## 🎯 Mục tiêu
*   Nâng cấp module Post Scheduler thành hệ thống đăng bài tự động hoàn chỉnh ngang tầm AutoWork.
*   Tự động viết bài Facebook bằng Google Gemini AI từ **chủ đề** hoặc **sản phẩm**.
*   Hỗ trợ 2 chế độ đăng: **Đăng ngay** (instant) và **Duyệt trước** (review).
*   Tự động **comment đầu tiên** sau khi đăng bài thành công.
*   Tự động **lặp lại** chu kỳ đăng khi hết nội dung.

---

## 📋 Phạm vi Phase 5.5 (Chỉ Facebook)

| Tính năng | Trạng thái |
|---|---|
| Đăng bài từ chủ đề (AI sinh + tự đăng) | ✅ Hoàn thành |
| Đăng bài từ sản phẩm (thêm thủ công + AI viết) | ✅ Hoàn thành |
| Comment tự động đầu tiên sau đăng | ✅ Hoàn thành |
| 2 chế độ: Đăng ngay / Duyệt trước | ✅ Hoàn thành |
| Tự lặp lại khi hết queue | ✅ Hoàn thành |
| Ảnh từ upload URL / Tải ảnh lên | ✅ Hoàn thành |
| Quản lý thiết lập (CRUD + toggle) | ✅ Hoàn thành |
| Quản lý sản phẩm (CRUD) | ✅ Hoàn thành |
| Chỉnh sửa bài viết & thay thế ảnh khi Duyệt trước | ✅ Hoàn thành |
| Tải ảnh trực tiếp lên server để đăng bài | ✅ Hoàn thành |
| Zalo OA / Website | ❌ Chưa làm (Phase sau) |
| AI sinh hình ảnh / video | ❌ Chưa làm |
| WooCommerce | ❌ Không tích hợp |

---

## 🗄️ Thiết kế Cơ sở dữ liệu

### Bảng `auto_setups` (Thiết lập tự động / Campaign)
```php
Schema::create('auto_setups', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('name');
    $table->enum('source_type', ['topic', 'product']);
    $table->json('fanpage_ids');
    $table->string('language', 10)->default('vi');
    $table->enum('post_length', ['super_short', 'short', 'medium', 'full', 'detailed']);
    $table->string('writing_style');
    $table->text('custom_prompt')->nullable();
    $table->boolean('use_fanpage_info')->default(false);
    $table->boolean('include_contact')->default(false);
    $table->text('contact_info')->nullable();
    $table->enum('schedule_mode', ['weekly', 'fixed']);
    $table->json('schedule_days')->nullable();
    $table->date('schedule_date')->nullable();
    $table->json('schedule_times');
    $table->boolean('auto_post')->default(true);
    $table->boolean('auto_repeat')->default(false);
    $table->enum('publish_mode', ['instant', 'review']);
    $table->text('auto_comment')->nullable();
    $table->enum('status', ['active', 'paused', 'completed']);
    $table->timestamps();
});
```

### Bảng `products` (Sản phẩm)
```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('name');
    $table->text('description')->nullable();
    $table->json('image_urls')->nullable();
    $table->text('comment')->nullable();
    $table->boolean('auto_post_enabled')->default(true);
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

### Bảng `topics` (Chủ đề)
```php
Schema::create('topics', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('auto_setup_id')->constrained('auto_setups')->onDelete('cascade');
    $table->string('title');
    $table->enum('status', ['pending', 'generated', 'published', 'failed']);
    $table->text('generated_content')->nullable();
    $table->string('generated_image_url')->nullable();
    $table->string('fb_post_id')->nullable();
    $table->text('error_log')->nullable();
    $table->integer('sort_order')->default(0);
    $table->timestamps();
});
```

---

## 🔌 API Endpoints

### Auto-Setup (Campaign)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/auto-setups` | Danh sách thiết lập (filter: status, search) |
| POST | `/api/auto-setups` | Tạo thiết lập mới |
| GET | `/api/auto-setups/{id}` | Chi tiết 1 thiết lập (kèm topics) |
| PUT | `/api/auto-setups/{id}` | Cập nhật thiết lập |
| DELETE | `/api/auto-setups/{id}` | Xóa thiết lập (cascade topics) |
| POST | `/api/auto-setups/{id}/toggle` | Bật/Tắt (active ↔ paused) |

### Topics (Chủ đề)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/auto-setups/{id}/topics` | Danh sách chủ đề |
| POST | `/api/auto-setups/{id}/topics` | Thêm chủ đề thủ công |
| POST | `/api/auto-setups/{id}/generate-topics` | AI sinh danh sách chủ đề |
| DELETE | `/api/topics/{id}` | Xóa chủ đề |
| PUT | `/api/topics/{id}` | Cập nhật chủ đề (nội dung & ảnh) |
| POST | `/api/topics/{id}/approve` | Duyệt & đăng bài (cho chế độ review) |

### Products (Sản phẩm)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/products` | Danh sách (search, filter by status) |
| POST | `/api/products` | Thêm sản phẩm |
| PUT | `/api/products/{id}` | Sửa sản phẩm |
| DELETE | `/api/products/{id}` | Xóa sản phẩm |
| POST | `/api/products/reorder` | Sắp xếp lại thứ tự |

### Upload (Tải lên)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/upload` | Tải ảnh từ thiết bị lên server (trả về URL công khai) |


---

## ⚙️ AI Engine & Pipeline

### GeminiService (3 phương thức mới)
1. `generateTopicsList(prompt, count, language)` — Sinh danh sách chủ đề dạng JSON array
2. `generatePostFromTopic(topic, config)` — Viết bài Facebook từ chủ đề + cấu hình
3. `generatePostFromProduct(productInfo, config)` — Viết bài Facebook từ sản phẩm

### ProcessAutoSetupJob (Queue Job)
1. Kiểm tra `auto_setup.status === 'active'`
2. Lấy topic/product tiếp theo (`pending`, theo sort_order)
3. Gọi GeminiService viết bài
4. **Instant mode**: Đăng lên Facebook → Auto comment → Trạng thái `published`
5. **Review mode**: Lưu content → Trạng thái `generated` → Chờ user duyệt
6. Khi hết: `auto_repeat = true` → Reset; `false` → `completed`

### RunAutoSetupsCommand (`autosetups:run`)
- Chạy mỗi phút qua Laravel Scheduler
- Quét tất cả setup `active` + `auto_post = true`
- Kiểm tra schedule match (thời gian + ngày)
- Dispatch `ProcessAutoSetupJob` vào Redis queue

---

## 🎨 Frontend (`/autopost`)
Trang mới 4 tabs:
1. **Thiết lập từ chủ đề**: Form config đầy đủ + AI sinh topics + Chọn fanpage
2. **Quản lý lịch đăng**: Danh sách setups + Toggle + Expand topics + Duyệt bài
3. **Thêm sản phẩm**: Form CRUD sản phẩm + Upload ảnh URL
4. **Danh sách sản phẩm**: Bảng SP + Toggle + Search + Xóa

---

## 🧪 Kiểm định
1. **Migrations**: 3 bảng mới chạy thành công trên Docker PostgreSQL.
2. **Next.js Build**: Biên dịch 100% thành công, TypeScript 0 lỗi.
3. **Manual Test**: Tạo setup → AI sinh topics → Kích hoạt → `autosetups:run` → Bài đăng lên Facebook.
