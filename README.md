## Render Quick Deploy

Use Render Blueprint from repo root. Render will read `render.yaml` and create:
- Web service: `cbk-backend`
- Cron service: `cbk-backend-keepwarm`

### 1) Deploy With Blueprint

1. Render Dashboard -> New -> Blueprint.
2. Select this repository.
3. Confirm the `backend` rootDir services are detected.
4. Create services.

### 2) Set Env Vars (Copy-Paste)

Set these on service `cbk-backend`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/chakhna-by-kilo?retryWrites=true&w=majority
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006,https://cbk-user.vercel.app,https://cbk-admin.vercel.app
ALLOW_RENDER_PREVIEWS=true
ALLOW_VERCEL_PREVIEWS=true
ADMIN_API_KEYS=owner:replace_with_owner_key,manager:replace_with_manager_key
ENFORCE_ADMIN_AUTH=false
```

Set this on service `cbk-backend-keepwarm`:

```env
BACKEND_HEALTHCHECK_URL=https://<your-backend-service>.onrender.com/api/health
```

### 3) Verify

1. Open `https://<your-backend-service>.onrender.com/api/health`
2. Expect JSON with `"ok": true`
3. Confirm `database` is `"mongo"` after setting a valid `MONGO_URI`

