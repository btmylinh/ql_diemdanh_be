# Quản Lý Điểm Danh - Backend API

## 📋 Mô tả dự án

Backend API cho hệ thống quản lý điểm danh sinh viên tham gia các hoạt động tại Khoa CNTT. Hệ thống hỗ trợ quản lý hoạt động, đăng ký sinh viên, điểm danh bằng QR code và báo cáo thống kê.

## ✨ Tính năng chính

- **🔐 Xác thực người dùng**: Đăng ký, đăng nhập, phân quyền (Admin, Manager, Student)
- **📅 Quản lý hoạt động**: Tạo, sửa, xóa hoạt động với thông tin chi tiết
- **📝 Quản lý đăng ký**: Sinh viên đăng ký tham gia hoạt động
- **📱 Điểm danh QR**: Tạo và quét mã QR để điểm danh
- **📊 Báo cáo thống kê**: Thống kê theo hoạt động, sinh viên, thời gian
- **💾 Sao lưu dữ liệu**: Backup và restore dữ liệu hệ thống
- **🔄 Tự động cập nhật**: Tự động cập nhật trạng thái hoạt động theo thời gian

## 🛠️ Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM và database toolkit
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **QRCode** - QR code generation
- **CORS** - Cross-origin resource sharing

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js (v16 trở lên)
- PostgreSQL
- npm hoặc yarn

### Các bước cài đặt

1. **Clone repository và di chuyển vào thư mục backend**
   ```bash
   cd ql_diemdanh_be
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Cấu hình database**
   - Tạo database PostgreSQL
   - Sao chép file `.env.example` thành `.env`
   - Cập nhật thông tin database trong file `.env`:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
     JWT_SECRET="your_jwt_secret_key"
     PORT=4000
     ```

4. **Chạy migration database**
   ```bash
   npm run prisma:migrate
   ```

5. **Khởi động server**
   ```bash
   # Development mode
   npm run dev
   
   
   # Production mode
   npm start
   ```

## 🚀 Sử dụng

### API Endpoints

#### Authentication
- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập
- `POST /auth/logout` - Đăng xuất
- `PUT /auth/change-password` - Đổi mật khẩu

#### Activities (Hoạt động)
- `GET /activities` - Lấy danh sách hoạt động
- `POST /activities` - Tạo hoạt động mới
- `GET /activities/:id` - Lấy chi tiết hoạt động
- `PUT /activities/:id` - Cập nhật hoạt động
- `DELETE /activities/:id` - Xóa hoạt động
- `GET /activities/:id/qr` - Lấy mã QR của hoạt động

#### Registrations (Đăng ký)
- `GET /registrations` - Lấy danh sách đăng ký
- `POST /registrations` - Đăng ký tham gia hoạt động
- `DELETE /registrations/:id` - Hủy đăng ký

#### Attendances (Điểm danh)
- `GET /attendances` - Lấy danh sách điểm danh
- `POST /attendances/checkin` - Điểm danh bằng QR
- `GET /attendances/activity/:id` - Lấy danh sách điểm danh theo hoạt động

#### Users (Người dùng)
- `GET /users` - Lấy danh sách người dùng
- `GET /users/:id` - Lấy thông tin người dùng
- `PUT /users/:id` - Cập nhật thông tin người dùng
- `DELETE /users/:id` - Xóa người dùng

#### Reports (Báo cáo)
- `GET /reports/activities` - Báo cáo hoạt động
- `GET /reports/attendances` - Báo cáo điểm danh
- `GET /reports/users` - Báo cáo người dùng
- `GET /reports/export` - Xuất báo cáo

### Ví dụ sử dụng

#### Đăng nhập
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'
```

#### Tạo hoạt động mới
```bash
curl -X POST http://localhost:4000/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Workshop Flutter",
    "description": "Học Flutter từ cơ bản",
    "location": "Phòng A101",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T17:00:00Z",
    "maxParticipants": 50,
    "trainingPoints": 2
  }'
```

## 📁 Cấu trúc thư mục

```
ql_diemdanh_be/
├── src/
│   ├── controllers/     # Controllers xử lý request
│   ├── services/       # Business logic
│   ├── routes/         # API routes
│   ├── middlewares/    # Middleware functions
│   ├── models/         # DTOs và data models
│   ├── lib/           # Utilities và configurations
│   └── server.js      # Entry point
├── prisma/
│   └── schema.prisma  # Database schema
├── test-api/         # API testing scripts
├── package.json
└── README.md
```

## 🔧 Scripts

- `npm run dev` - Chạy server ở development mode với nodemon
- `npm start` - Chạy server ở production mode
- `npm run prisma:migrate` - Chạy database migration

## 🧪 Testing

Sử dụng các file test trong thư mục `test-api/` để test các API endpoints:

```bash
# Test authentication
node test-api/test-auth.js

# Test activities
node test-api/test-activities.js

# Test attendances
node test-api/test-attendances.js
```

## 📊 Database Schema

Hệ thống sử dụng PostgreSQL với các bảng chính:
- `user` - Thông tin người dùng
- `activity` - Thông tin hoạt động
- `registration` - Đăng ký tham gia hoạt động
- `attendance` - Điểm danh sinh viên
- `backup` - Lịch sử sao lưu

## 🔒 Bảo mật

- Mật khẩu được hash bằng bcrypt
- JWT token cho authentication
- CORS được cấu hình để bảo mật
- Middleware xác thực cho các API protected

## 📝 Ghi chú

- Server tự động cập nhật trạng thái hoạt động mỗi 5 phút
- QR code được tạo tự động khi tạo hoạt động
- Hệ thống hỗ trợ backup và restore dữ liệu
- API có thể được test bằng các script trong thư mục `test-api/`

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới giấy phép ISC.