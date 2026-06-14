import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Handle both GET and POST for the OAuth callback
  const handleCallback = async (req: Request, res: Response) => {
    console.log("[OAuth] Callback received - method:", req.method, "query:", JSON.stringify(req.query), "body:", JSON.stringify(req.body), "url:", req.originalUrl);
    // Try query params first, then body (some OAuth providers POST the callback)
    const code = getQueryParam(req, "code") || (req.body && req.body.code);
    const state = getQueryParam(req, "state") || (req.body && req.body.state);

    if (!code || !state) {
      console.log("[OAuth] Missing code or state. code:", code, "state:", state);
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // State contains btoa(redirectUri) which is the callback URL itself.
      // After successful auth, redirect to the app root.
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  };

  app.get("/api/oauth/callback", handleCallback);
  app.post("/api/oauth/callback", handleCallback);
}
