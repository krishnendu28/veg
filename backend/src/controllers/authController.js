import { buildAuthFailure, getOutletSettings, getUserFromToken, listOutlets, loginUser, logoutToken, updateOutletSettings } from "../services/authService.js";

function getBearerToken(req) {
  const header = String(req.headers.authorization || "").trim();
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }

  return String(req.headers["x-admin-key"] || "").trim();
}

export async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const result = loginUser(email, password);
    if (!result) {
      throw buildAuthFailure("Invalid email or password.", 401);
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function meHandler(req, res, next) {
  try {
    const token = getBearerToken(req);
    const user = getUserFromToken(token);
    if (!user) {
      throw buildAuthFailure("Unauthorized.", 401);
    }

    return res.json(user);
  } catch (error) {
    return next(error);
  }
}

export async function logoutHandler(req, res) {
  const token = getBearerToken(req);
  if (token) {
    logoutToken(token);
  }

  return res.json({ success: true, message: "Logged out" });
}

export async function listOutletsHandler(_req, res) {
  return res.json(listOutlets());
}

export async function getOutletSettingsHandler(req, res, next) {
  try {
    const outletId = Number(req.params.outletId);
    const settings = getOutletSettings(outletId);
    if (!settings) {
      throw buildAuthFailure("Outlet settings not found.", 404);
    }

    return res.json(settings);
  } catch (error) {
    return next(error);
  }
}

export async function updateOutletSettingsHandler(req, res, next) {
  try {
    const outletId = Number(req.params.outletId);
    const settings = updateOutletSettings(outletId, req.body || {});
    if (!settings) {
      throw buildAuthFailure("Outlet settings not found.", 404);
    }

    return res.json(settings);
  } catch (error) {
    return next(error);
  }
}
