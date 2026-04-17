import { Router } from "express";
import { deleteCustomerHandler, getCustomerHandler, listCustomersHandler, upsertCustomerHandler } from "../controllers/customerController.js";
import { validateRequest } from "../middlewares/validate.js";
import { customerIdParamSchema, customerQuerySchema, upsertCustomerSchema } from "../schemas/customer-schema.js";

const router = Router();

router.get("/", validateRequest({ querySchema: customerQuerySchema }), listCustomersHandler);
router.get("/:id", validateRequest({ paramsSchema: customerIdParamSchema }), getCustomerHandler);
router.post("/", validateRequest({ bodySchema: upsertCustomerSchema }), upsertCustomerHandler);
router.delete("/:id", validateRequest({ paramsSchema: customerIdParamSchema }), deleteCustomerHandler);

export default router;