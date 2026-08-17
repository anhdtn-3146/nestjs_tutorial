# Authentication

Hệ thống sử dụng JWT access token, opaque refresh token, PostgreSQL để quản lý
session và Redis để thu hồi access token ngay khi logout.

## Cấu hình

```dotenv
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_EXPIRES_IN_SECONDS=900
REFRESH_TOKEN_EXPIRES_IN_DAYS=7

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

`JWT_SECRET` cũ vẫn được dùng làm fallback trong thời gian chuyển đổi, nhưng nên
đổi sang `JWT_ACCESS_SECRET`.

Chạy migration trước khi khởi động ứng dụng:

```bash
npm run migration:run
```

PostgreSQL và Redis phải hoạt động trước khi chạy `npm run start:dev`.

## Dữ liệu session

Mỗi lần login tạo một dòng trong `auth_sessions`. Một người dùng có thể có nhiều
session cho nhiều thiết bị.

| Cột                        | Mục đích                                              |
| -------------------------- | ----------------------------------------------------- |
| `id`                       | Session ID, được ghi vào claim `sid` của access token |
| `user_id`                  | Người dùng sở hữu session                             |
| `refresh_token_hash`       | SHA-256 của refresh token; không lưu token gốc        |
| `expires_at`               | Hạn sử dụng refresh token                             |
| `revoked_at`               | Thời điểm logout; `NULL` nghĩa là chưa revoke         |
| `created_at`, `updated_at` | Thời gian tạo và cập nhật session                     |

## Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "access_token": "jwt-access-token",
  "refresh_token": "opaque-random-token",
  "token_type": "Bearer",
  "expires_in": 900
}
```

Access token có các claim `sub`, `sid`, `jti`, `email`, `role` và
`type: "access"`. Client phải lưu refresh token ở nơi an toàn.

## Refresh token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "opaque-random-token"
}
```

Endpoint này public vì access token có thể đã hết hạn. Nếu session còn hiệu lực,
server trả một cặp token mới có cùng cấu trúc với response login.

Refresh token được rotation sau mỗi lần sử dụng. Token cũ lập tức không còn khớp
với hash trong DB; nếu gửi lại sẽ nhận `401 Unauthorized`. Update có điều kiện
trên hash cũ nên hai request refresh đồng thời chỉ một request thành công.

## Logout

```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

Response `200`:

```json
{
  "success": true
}
```

Server lấy `sid` từ access token để đặt `revoked_at` cho session. Claim `jti`
được lưu vào Redis với key:

```text
auth:blacklist:access:<jti>
```

TTL của key bằng số giây còn lại của access token. Vì vậy access token vừa logout
bị từ chối ngay, còn Redis tự dọn blacklist khi token hết hạn.

## Mã lỗi chính

- `401`: thông tin login sai, access token thiếu/sai/hết hạn/đã blacklist hoặc
  refresh token không hợp lệ, hết hạn, đã revoke hay đã được rotation.
- `422`: request body không qua validation.

## Luồng kiểm thử tối thiểu

1. Login và xác nhận DB chỉ chứa hash của refresh token.
2. Dùng refresh token, nhận token mới và xác nhận token cũ trả `401`.
3. Logout bằng access token.
4. Xác nhận session có `revoked_at`, Redis có blacklist key và cả access token lẫn
   refresh token cũ đều không dùng lại được.
