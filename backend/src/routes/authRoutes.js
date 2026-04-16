import { Router } from "express";
import { loginHandler, logoutHandler, meHandler } from "../controllers/authController.js";

const router = Router();

router.post("/login", loginHandler);
router.get("/me", meHandler);
router.post("/logout", logoutHandler);

export default router;
