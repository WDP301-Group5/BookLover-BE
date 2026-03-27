export interface IWithdraw {
    id: string;
    userId: string;
    phoneNumber: string;
    amount: number;
    status: "pending" | "success" | "failed" | "canceled";
    createdAt?: Date;
    updatedAt?: Date;
}