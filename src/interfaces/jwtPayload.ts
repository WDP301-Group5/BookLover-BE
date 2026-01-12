export interface JwtPayload {
	id: string;
	fullName: string;
	role: string;
	nickName?: string;
	iat?: number;
	exp?: number;
}
