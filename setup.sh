#!/bin/bash

# Zeflyo Automated Onboarding Script
# Hỗ trợ tự động thiết lập dự án cho các thành viên trong nhóm.

# Định nghĩa màu sắc hiển thị
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================================${NC}"
echo -e "${GREEN}    🚀 CHÀO MỪNG BẠN ĐẾN VỚI HỆ THỐNG AUTOMATION ZEFLYO 🚀${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "Đang chuẩn bị môi trường phát triển..."
sleep 1

# 1. Kiểm tra môi trường Docker & Docker Compose
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}Lỗi: Docker chưa được cài đặt. Vui lòng cài đặt Docker và thử lại.${NC}" >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ] && ! docker compose version &>/dev/null; then
  echo -e "${RED}Lỗi: Docker Compose chưa được cài đặt. Vui lòng cài đặt và thử lại.${NC}" >&2
  exit 1
fi

# 2. Tạo file môi trường .env cho Backend
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}👉 Đang tạo file cấu hình backend/.env từ file mẫu...${NC}"
  cp backend/.env.example backend/.env
  echo -e "${GREEN}✓ Đã tạo thành công backend/.env${NC}"
  
  echo -e "${YELLOW}======================================================="
  echo -e "⚠️  HÀNH ĐỘNG CẦN THIẾT TỪ BẠN:"
  echo -e "Vui lòng mở file 'backend/.env' và điền các mã khóa Meta App của bạn (nếu có):"
  echo -e "  - FACEBOOK_CLIENT_ID (App ID)"
  echo -e "  - FACEBOOK_CLIENT_SECRET (App Secret)"
  echo -e "=======================================================${NC}"
  read -p "Sau khi đã kiểm tra file .env, bấm [ENTER] để tiếp tục..."
else
  echo -e "${GREEN}✓ File backend/.env đã tồn tại. Bỏ qua bước tạo.${NC}"
fi

# 3. Khởi chạy Docker Containers
echo -e "\n${BLUE}🐳 Đang khởi động các dịch vụ Docker (Nginx, Postgres, Redis, Soketi)...${NC}"
docker compose up -d --build

if [ $? -ne 0 ]; then
  echo -e "${RED}Lỗi: Không thể khởi chạy Docker Compose. Kiểm tra xem Docker Daemon có đang chạy không.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Docker containers đã hoạt động ổn định.${NC}"

# 4. Cấu hình Laravel Backend trong container
echo -e "\n${BLUE}📦 Đang cài đặt thư viện PHP & thiết lập Database...${NC}"
docker compose exec app composer install

echo -e "🔑 Sinh App Key cho Laravel..."
docker compose exec app php artisan key:generate

echo -e "🗄️ Thực thi Database Migrations..."
docker compose exec app php artisan migrate --force

echo -e "${GREEN}✓ Backend đã thiết lập xong 100%!${NC}"

# 5. Cấu hình Frontend Next.js
echo -e "\n${BLUE}💻 Đang cài đặt môi trường Next.js Frontend...${NC}"
if ! [ -x "$(command -v npm)" ]; then
  echo -e "${YELLOW}Cảnh báo: Không tìm thấy Node.js/npm trên máy của bạn.${NC}"
  echo -e "Vui lòng tự chạy lệnh 'npm install' và 'npm run dev' trong thư mục '/frontend' sau khi cài Node.js."
else
  cd frontend
  echo -e "Đang cài đặt node_modules (npm install)..."
  npm install
  cd ..
  echo -e "${GREEN}✓ Frontend đã cài đặt xong các thư viện.${NC}"
fi

# 6. Hoàn tất & Hướng dẫn sử dụng
echo -e "${BLUE}=======================================================${NC}"
echo -e "${GREEN}🎉 THIẾT LẬP THÀNH CÔNG! HỆ THỐNG ĐÃ SẴN SÀNG ĐỂ CHẠY 🎉${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "Để chạy Frontend và bắt đầu sử dụng:"
echo -e "  1. Mở terminal mới, di chuyển vào thư mục: ${YELLOW}cd frontend${NC}"
echo -e "  2. Chạy lệnh phát triển: ${YELLOW}npm run dev${NC}"
echo -e "  3. Truy cập trình duyệt: ${GREEN}http://localhost:3000${NC}"
echo -e "  4. Đăng nhập qua nút ${BLUE}Mock Dev Mode (Demo Sandbox)${NC} để test nhanh."
echo -e "${BLUE}=======================================================${NC}"
