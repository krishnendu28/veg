"use client";

import { useEffect } from "react";
import App from "@/App";
import { setAuthTokenGetter, setBaseUrl } from "@/lib/api-client-react";
import { TOKEN_KEY } from "@/lib/constants";

export default function LegacyClientApp() {
  useEffect(() => {
    setBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000");
    setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));
  }, []);

  return <App />;
}
