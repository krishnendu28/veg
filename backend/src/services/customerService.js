import { randomUUID } from "crypto";
import { Customer } from "../models/Customer.js";
import { logger } from "../utils/logger.js";

const memoryCustomers = [];
let useMongo = false;

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeSearch(value) {
  return normalizeName(value).toLowerCase();
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toMemoryCustomer(payload) {
  return {
    _id: randomUUID(),
    name: normalizeName(payload.name),
    phone: normalizePhone(payload.phone),
    address: normalizeName(payload.address),
    balance: Number(payload.balance) || 0,
    orderCount: Number(payload.orderCount) || 0,
    lifetimeSpend: Number(payload.lifetimeSpend) || 0,
    lastVisit: payload.lastVisit || null,
    transactions: Array.isArray(payload.transactions) ? payload.transactions : [],
    createdAt: payload.createdAt || new Date(),
    updatedAt: payload.updatedAt || new Date(),
  };
}

function formatCustomer(customer) {
  if (!customer) return null;
  const balance = Number(customer.balance) || 0;
  return {
    ...customer,
    balance,
    due: balance < 0 ? Math.abs(balance) : 0,
    wallet: balance > 0 ? balance : 0,
  };
}

function formatCustomerSummary(customer) {
  const formatted = formatCustomer(customer);
  if (!formatted) return null;

  return {
    _id: formatted._id,
    name: formatted.name,
    phone: formatted.phone,
    address: formatted.address,
    balance: formatted.balance,
    due: formatted.due,
    wallet: formatted.wallet,
    orderCount: Number(formatted.orderCount) || 0,
    lifetimeSpend: Number(formatted.lifetimeSpend) || 0,
    lastVisit: formatted.lastVisit,
    createdAt: formatted.createdAt,
    updatedAt: formatted.updatedAt,
  };
}

function formatCustomerDetail(customer) {
  const summary = formatCustomerSummary(customer);
  if (!summary) return null;

  return {
    ...summary,
    transactions: Array.isArray(customer.transactions)
      ? customer.transactions.slice(-20).reverse().map((transaction) => ({
          ...transaction,
          amount: Number(transaction.amount) || 0,
          balanceAfter: Number(transaction.balanceAfter) || 0,
        }))
      : [],
  };
}

function matchesCustomer(customer, query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return (
    normalizeSearch(customer.name).includes(normalized) ||
    normalizePhone(customer.phone).includes(normalized) ||
    normalizeSearch(customer.address).includes(normalized)
  );
}

async function withMongoFallback(operationName, mongoOperation, memoryOperation) {
  if (!useMongo) return memoryOperation();

  try {
    return await mongoOperation();
  } catch (error) {
    useMongo = false;
    logger.warn("database.runtime_fallback_memory", {
      operation: operationName,
      reason: error?.message || String(error),
    });
    return memoryOperation();
  }
}

export function setMongoEnabled(enabled) {
  useMongo = Boolean(enabled);
}

export function isMongoEnabled() {
  return useMongo;
}

function findMemoryCustomerById(id) {
  return memoryCustomers.find((customer) => customer._id === id) || null;
}

function findMemoryCustomerByIdentity({ customerId, phone, name }) {
  if (customerId) {
    return findMemoryCustomerById(String(customerId)) || null;
  }

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone) {
    const byPhone = memoryCustomers.find((customer) => normalizePhone(customer.phone) === normalizedPhone);
    if (byPhone) return byPhone;
  }

  const normalizedName = normalizeSearch(name);
  if (!normalizedName) return null;

  return (
    memoryCustomers.find((customer) => normalizeSearch(customer.name) === normalizedName) ||
    memoryCustomers.find((customer) => normalizeSearch(customer.name).includes(normalizedName)) ||
    null
  );
}

function recordTransaction(customer, delta, { note = "", orderId = "" } = {}) {
  const amount = Math.abs(Number(delta) || 0);
  if (!amount) return customer;

  const type = delta >= 0 ? "credit" : "debit";
  const balanceAfter = Number(customer.balance || 0) + delta;
  const transaction = {
    _id: randomUUID(),
    type,
    amount,
    note,
    orderId,
    balanceAfter,
    createdAt: new Date(),
  };

  customer.balance = balanceAfter;
  customer.transactions = Array.isArray(customer.transactions) ? [...customer.transactions, transaction].slice(-50) : [transaction];
  customer.updatedAt = new Date();
  return customer;
}

function touchCustomer(customer, { name, phone, address, orderAmount = 0, lastVisit = new Date(), recordVisit = false }) {
  customer.name = normalizeName(name || customer.name);
  if (phone !== undefined) {
    customer.phone = normalizePhone(phone);
  }
  if (address !== undefined) {
    customer.address = normalizeName(address);
  }
  if (recordVisit) {
    customer.orderCount = Number(customer.orderCount || 0) + 1;
    customer.lifetimeSpend = Number(customer.lifetimeSpend || 0) + (Number(orderAmount) || 0);
    customer.lastVisit = lastVisit;
  }
  customer.updatedAt = new Date();
  return customer;
}

function upsertMemoryCustomer({ name, phone, address, openingBalance = 0, note = "" }) {
  let customer = findMemoryCustomerByIdentity({ phone, name });

  if (!customer) {
    customer = toMemoryCustomer({
      name,
      phone,
      address,
      balance: 0,
      orderCount: 0,
      lifetimeSpend: 0,
      lastVisit: null,
      transactions: [],
    });
    memoryCustomers.unshift(customer);
  }

  touchCustomer(customer, { name, phone, address, orderAmount: 0, recordVisit: false });

  if (Number(openingBalance) !== 0) {
    recordTransaction(customer, Number(openingBalance), { note: note || "Opening balance" });
  }

  return customer;
}

async function upsertMongoCustomer({ name, phone, address, openingBalance = 0, note = "" }) {
  const normalizedName = normalizeName(name);
  const normalizedPhone = normalizePhone(phone);
  const normalizedAddress = normalizeName(address);
  const searchFilter = normalizedPhone
    ? { phone: normalizedPhone }
    : { name: new RegExp(`^${escapeRegExp(normalizedName)}$`, "i") };

  let customer = await Customer.findOne(searchFilter);
  if (!customer) {
    customer = new Customer({
      name: normalizedName,
      phone: normalizedPhone,
      address: normalizedAddress,
      balance: 0,
      orderCount: 0,
      lifetimeSpend: 0,
      lastVisit: null,
      transactions: [],
    });
  }

  touchCustomer(customer, { name: normalizedName, phone: normalizedPhone, address: normalizedAddress, orderAmount: 0, recordVisit: false });

  if (Number(openingBalance) !== 0) {
    recordTransaction(customer, Number(openingBalance), { note: note || "Opening balance" });
  }

  await customer.save();
  return customer;
}

export async function listCustomers({ query = "" } = {}) {
  return withMongoFallback(
    "listCustomers",
    async () => {
      const customers = await Customer.find().sort({ updatedAt: -1 });
      return customers.filter((customer) => matchesCustomer(customer, query)).map((customer) => formatCustomerSummary(customer));
    },
    () => memoryCustomers.filter((customer) => matchesCustomer(customer, query)).map((customer) => formatCustomerSummary(customer)),
  );
}

export async function getCustomerById(id) {
  return withMongoFallback(
    "getCustomerById",
    async () => {
      const customer = await Customer.findById(id);
      return formatCustomerDetail(customer);
    },
    () => formatCustomerDetail(findMemoryCustomerById(id)),
  );
}

export async function deleteCustomer(id) {
  return withMongoFallback(
    "deleteCustomer",
    async () => {
      const deleted = await Customer.findByIdAndDelete(id);
      return Boolean(deleted);
    },
    () => {
      const index = memoryCustomers.findIndex((customer) => customer._id === String(id));
      if (index < 0) return false;
      memoryCustomers.splice(index, 1);
      return true;
    },
  );
}

export async function upsertCustomer(input) {
  return withMongoFallback("upsertCustomer", () => upsertMongoCustomer(input).then(formatCustomerDetail), () => formatCustomerDetail(upsertMemoryCustomer(input)));
}

export async function ensureCustomerFromOrder({ customerId, name, phone, address, total, orderId, paymentMethod }) {
  return withMongoFallback(
    "ensureCustomerFromOrder",
    async () => {
      let customer = null;

      if (customerId) {
        customer = await Customer.findById(customerId);
      }

      if (!customer) {
        const normalizedPhone = normalizePhone(phone);
        const normalizedName = normalizeName(name);
        customer = normalizedPhone
          ? await Customer.findOne({ phone: normalizedPhone })
          : await Customer.findOne({ name: new RegExp(`^${escapeRegExp(normalizedName)}$`, "i") });
      }

      if (!customer) {
        customer = new Customer({
          name: normalizeName(name),
          phone: normalizePhone(phone),
          address: normalizeName(address),
          balance: 0,
          orderCount: 0,
          lifetimeSpend: 0,
          lastVisit: null,
          transactions: [],
        });
      }

      touchCustomer(customer, {
        name: name || customer.name,
        phone,
        address,
        orderAmount: total,
        lastVisit: new Date(),
        recordVisit: true,
      });

      if (paymentMethod === "Account") {
        recordTransaction(customer, -Number(total || 0), { note: `Order ${orderId}`, orderId });
      }

      await customer.save();
      return customer;
    },
    () => {
      let customer = findMemoryCustomerByIdentity({ customerId, phone, name });
      if (!customer) {
        customer = toMemoryCustomer({
          name: normalizeName(name),
          phone: normalizePhone(phone),
          address: normalizeName(address),
        });
        memoryCustomers.unshift(customer);
      }

      touchCustomer(customer, {
        name: name || customer.name,
        phone,
        address,
        orderAmount: total,
        lastVisit: new Date(),
        recordVisit: true,
      });

      if (paymentMethod === "Account") {
        recordTransaction(customer, -Number(total || 0), { note: `Order ${orderId}`, orderId });
      }

      return customer;
    },
  ).then(formatCustomerDetail);
}