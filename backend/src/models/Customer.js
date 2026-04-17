import mongoose from "mongoose";

const customerTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "" },
    orderId: { type: String, default: "" },
    balanceAfter: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, versionKey: false },
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true, index: true },
    address: { type: String, default: "", trim: true },
    balance: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0, min: 0 },
    lifetimeSpend: { type: Number, default: 0, min: 0 },
    lastVisit: { type: Date, default: null },
    transactions: { type: [customerTransactionSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Customer = mongoose.model("Customer", customerSchema);