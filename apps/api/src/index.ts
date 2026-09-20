import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { config } from "./config.js";
import { contentRoutes } from "./routes/content.js";
import { scorecardRoutes } from "./routes/scorecard.js";
import { tvRoutes } from "./routes/tv.js";
import { adminRoutes } from "./routes/admin.js";
import { startTvDataRetentionJob } from "./lib/tv-data.js";

const app = Fastify({
  logger: true,
  trustProxy: true,
});

await app.register(helmet, {
  contentSecurityPolicy: false,
});

const allowedOrigins = config.CORS_ORIGIN.split(",").map((o) => o.trim());
const lanOrigin =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

await app.register(cors, {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin) || lanOrigin.test(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
});

await app.register(rateLimit, {
  global: true,
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  timeWindow: "1 minute",
});

app.get("/health", async () => ({ status: "ok", commit: config.APP_COMMIT }));

await app.register(contentRoutes, { prefix: "/api/v1" });
await app.register(scorecardRoutes, { prefix: "/api/v1" });
await app.register(tvRoutes, { prefix: "/api/v1" });
await app.register(adminRoutes, { prefix: "/api/v1" });

if (config.WEB_DIST) {
  await app.register(fastifyStatic, {
    root: config.WEB_DIST,
    wildcard: false,
  });
  app.setNotFoundHandler((request, reply) => {
    const url = request.raw.url ?? "";
    if (url.startsWith("/api") || url.startsWith("/health")) {
      return reply.code(404).send({ error: "Not found" });
    }
    return reply.sendFile("index.html");
  });
}

try {
  await app.listen({ port: config.API_PORT, host: config.API_HOST });
  startTvDataRetentionJob(app.log);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
