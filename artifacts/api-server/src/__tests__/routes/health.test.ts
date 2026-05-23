import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import express from "express";

vi.mock("@workspace/api-zod", () => ({
  HealthCheckResponse: { parse: vi.fn((x: unknown) => x) },
}));

import healthRouter from "../../routes/health.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", healthRouter);
  return app;
}

describe("GET /api/healthz", () => {
  it("200 con status ok", async () => {
    const res = await request(buildApp()).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
