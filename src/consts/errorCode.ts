// File định nghĩa các mã lỗi HTTP trả về từ server
//
// Lỗi do request không của client không hợp lệ
export const ERR_BAD_REQUEST = 400; // sai yêu cầu, thiếu data, sai format, ...
export const ERR_UNAUTHORIZED = 401; // chưa xác thực (chưa đăng nhập, không có token)
export const ERR_INVALID_TOKEN = 401; // Token sai (sửa token) hoặc hết hạn
export const ERR_FORBIDDEN = 403; // không có quyền truy cập tài nguyên
export const ERR_NOT_FOUND = 404; // không tìm thấy tài nguyên, sai đường dẫn
export const ERR_RESOURCE_CONFLICT = 409; // Trùng dữ liệu, xung đột dữ liệu

// Lỗi do server gặp sự cố
export const ERR_INTERNAL_SERVER = 500; // Lỗi máy chủ nội bộ
export const ERR_NOT_IMPLEMENTED = 501; // Chức năng chưa được triển khai
export const ERR_BAD_GATEWAY = 502; // Lỗi cổng kết nối
export const ERR_SERVICE_UNAVAILABLE = 503; // Dịch vụ không khả dụng
export const ERR_GATEWAY_TIMEOUT = 504; // Hết thời gian chờ cổng kết nối
