const express = require("express");
const path = require("path");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const DESIRE_HOST = "129.226.158.222";
const DESIRE_PORT = 8765;
const SLOT_PORT   = 3000;

const KL_PASSWORD   = "K♡L";
const KL_AUTH_TOKEN = process.env.KL_AUTH_TOKEN || "notre-kl-2026";
const AUTH_COOKIE   = "kl_auth";

function parseCookies(req) {
  const result = {};
  for (const chunk of (req.headers.cookie || "").split(";")) {
    const idx = chunk.indexOf("=");
    if (idx < 0) continue;
    result[chunk.slice(0, idx).trim()] = chunk.slice(idx + 1).trim();
  }
  return result;
}

function makeProxy(hostname, port, basePath) {
  return (req, res) => {
    const options = {
      hostname, port,
      path: basePath + req.path + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""),
      method: req.method,
      headers: { "content-type": req.headers["content-type"] || "application/json" },
    };
    const proxy = http.request(options, (proxyRes) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.status(proxyRes.statusCode);
      proxyRes.pipe(res);
    });
    proxy.on("error", () => res.status(502).json({ error: "upstream unreachable" }));
    if (req.method !== "GET") req.pipe(proxy);
    else proxy.end();
  };
}

app.use(express.json());

app.post("/api/auth/unlock", (req, res) => {
  if ((req.body || {}).password === KL_PASSWORD) {
    res.setHeader("Set-Cookie", `${AUTH_COOKIE}=${KL_AUTH_TOKEN}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`);
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

app.get("/api/auth/check", (req, res) => {
  res.json({ ok: parseCookies(req)[AUTH_COOKIE] === KL_AUTH_TOKEN });
});

app.use("/api/desire", makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/desire"));
app.use("/api/slot",   makeProxy("127.0.0.1",  SLOT_PORT,   "/api"));
app.use("/api/board",  makeProxy(DESIRE_HOST, DESIRE_PORT, "/api/board"));

// serve built frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));

app.listen(PORT, () => console.log(`notre-ici on :${PORT}`));
