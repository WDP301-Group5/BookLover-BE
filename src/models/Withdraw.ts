import mongoose from "mongoose";
import { IWithdraw } from "../interfaces/withdraw";

const withdrawSchema = new mongoose.Schema(
  {
    id: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IWithdraw>("Withdraw", withdrawSchema);
