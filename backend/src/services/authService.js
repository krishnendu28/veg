import { randomUUID } from "crypto";

const demoOutlets = [
  {
    id: 1,
    name: "Veg Spicy Hut",
    address: "New Town, Kolkata - 700135",
    phone: "+91-84202 52042",
    email: "owner@tabio.com",
    gstNumber: "",
    fssaiNumber: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    logoUrl: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const demoSettings = {
  outletId: 1,
  gstEnabled: true,
  gstRate: 5,
  serviceChargeEnabled: false,
  serviceChargeRate: 0,
  loyaltyPointsPerRupee: 1,
  loyaltyRedemptionRate: 100,
  currencySymbol: "₹",
  receiptFooter: "Thank you for visiting Veg Spicy Hut!",
  printKotAutomatically: true,
  carbonTrackingEnabled: false,
  zomatoEnabled: false,
  swiggyEnabled: false,
};

const demoUsers = [
  { id: 1, email: "owner@tabio.com", name: "Veg Spicy Hut Owner", role: "owner", outletId: 1, password: "demo1234" },
  { id: 2, email: "manager@tabio.com", name: "Veg Spicy Hut Manager", role: "manager", outletId: 1, password: "demo1234" },
  { id: 3, email: "cashier@tabio.com", name: "Veg Spicy Hut Cashier", role: "cashier", outletId: 1, password: "demo1234" },
  { id: 4, email: "kitchen@tabio.com", name: "Veg Spicy Hut Kitchen", role: "kitchen", outletId: 1, password: "demo1234" },
  { id: 5, email: "waiter@tabio.com", name: "Veg Spicy Hut Waiter", role: "waiter", outletId: 1, password: "demo1234" },
];

const sessions = new Map();

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function loginUser(email, password) {
  const user = demoUsers.find((entry) => normalize(entry.email) === normalize(email) && entry.password === String(password || ""));
  if (!user) return null;

  const token = randomUUID();
  sessions.set(token, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    outletId: user.outletId,
    createdAt: new Date().toISOString(),
  });

  return {
    user: sessions.get(token),
    token,
  };
}

export function getUserFromToken(token) {
  return sessions.get(String(token || "").trim()) || null;
}

export function logoutToken(token) {
  return sessions.delete(String(token || "").trim());
}

export function listOutlets() {
  return demoOutlets;
}

export function getOutletSettings(outletId) {
  if (Number(outletId) !== 1) return null;
  return { ...demoSettings, outletId: Number(outletId) };
}

export function updateOutletSettings(outletId, updates) {
  if (Number(outletId) !== 1) return null;
  Object.assign(demoSettings, updates, { outletId: Number(outletId) });
  return { ...demoSettings };
}

export function buildAuthFailure(message, statusCode = 401) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
