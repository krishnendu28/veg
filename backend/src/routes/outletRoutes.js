import { Router } from "express";
import { getOutletSettingsHandler, listOutletsHandler, updateOutletSettingsHandler } from "../controllers/authController.js";

const router = Router();

router.get("/", listOutletsHandler);
router.get("/:outletId/settings", getOutletSettingsHandler);
router.put("/:outletId/settings", updateOutletSettingsHandler);

export default router;
