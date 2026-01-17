const _Provider = [
	"local", // tự đăng ký tài khoản
	"google", // đăng ký bằng tài khoản google
	// sau nếu có thể mở rộng thêm
];

export interface IUserAuth {
	id: string;
	userId: string;
	username: string;
	email: string;
	password: string;
	providerUserId: string;
	provider: string | "local" | "google";
	createdAt?: Date;
	lastLoginAt?: Date;
}
