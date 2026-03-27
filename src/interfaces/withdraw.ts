export interface IWithdraw {
    id: string;
    userId: string;
    phoneNumber: string;
    amount: number;
    status: "pending" | "success" | "failed" | "cancelled";
    createdAt?: Date;
    updatedAt?: Date;
}