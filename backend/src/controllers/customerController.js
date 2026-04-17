import { deleteCustomer, getCustomerById, listCustomers, upsertCustomer } from "../services/customerService.js";

export async function listCustomersHandler(req, res) {
  try {
    const querySource = req.validatedQuery || req.query || {};
    const query = String(querySource.query || "").trim();
    const customers = await listCustomers({ query });
    return res.json(customers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch customers." });
  }
}

export async function getCustomerHandler(req, res) {
  try {
    const { id } = req.params;
    const customer = await getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    return res.json(customer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch customer." });
  }
}

export async function upsertCustomerHandler(req, res) {
  try {
    const customer = await upsertCustomer(req.body);
    return res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to save customer." });
  }
}

export async function deleteCustomerHandler(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteCustomer(id);
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found." });
    }

    return res.json({ ok: true, _id: id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete customer." });
  }
}