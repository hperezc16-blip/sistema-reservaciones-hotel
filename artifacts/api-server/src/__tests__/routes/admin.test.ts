import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// ─── Default mock chain (overridden per-test with mockReturnValueOnce) ─────────

let mockSelectResult: unknown[] = [];

const mockSelectChain: any = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
    return Promise.resolve(mockSelectResult).then(resolve as never, reject as never);
  },
};

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  ne: vi.fn(),
  lte: vi.fn(),
  gte: vi.fn(),
  desc: vi.fn(),
  count: vi.fn(),
  sql: vi.fn(),
}));

vi.mock("@workspace/db", () => ({
  db: {
    select: vi.fn(() => mockSelectChain),
    insert: vi.fn(),
    update: vi.fn(),
  },
  reservationsTable: {
    id: "id",
    clienteId: "clienteId",
    habitacionId: "habitacionId",
    estado: "estado",
    fechaEntrada: "fechaEntrada",
    fechaSalida: "fechaSalida",
    precioTotal: "precioTotal",
    createdAt: "createdAt",
  },
  roomsTable: { id: "id", nombre: "nombre", tipo: "tipo", precioNoche: "precioNoche", activo: "activo" },
  usersTable: { id: "id", email: "email" },
}));

// ─── Post-mock imports ────────────────────────────────────────────────────────

import adminRouter from "../../routes/admin.js";
import { db } from "@workspace/db";
import { signToken } from "../../middlewares/auth.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", adminRouter);
  return app;
}

function adminToken() {
  return signToken({ id: "admin-1", email: "admin@test.com", rol: "admin" });
}

function makeChain(val: unknown): any {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      return Promise.resolve(val).then(resolve as never, reject as never);
    },
  };
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult = [];
  });

  it("401 sin token", async () => {
    const res = await request(buildApp()).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("403 con token de cliente", async () => {
    const token = signToken({ id: "u1", email: "u@test.com", rol: "cliente" });
    const res = await request(buildApp())
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 retorna estadísticas (sin reservas recientes)", async () => {
    const selectMock = vi.mocked(db.select as (...args: unknown[]) => unknown);
    selectMock
      .mockReturnValueOnce(makeChain([{ count: 10 }]))  // totalRes
      .mockReturnValueOnce(makeChain([{ count: 2 }]))   // resHoy
      .mockReturnValueOnce(makeChain([{ count: 5 }]))   // totalRooms
      .mockReturnValueOnce(makeChain([]))               // occupiedToday
      .mockReturnValueOnce(makeChain([{ total: null }])) // ingresosMes
      .mockReturnValueOnce(makeChain([]));              // reservasRecientes (vacío → no enrichment)

    const token = adminToken();
    const res = await request(buildApp())
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.totalReservaciones).toBe(10);
    expect(res.body.reservacionesHoy).toBe(2);
    expect(res.body.totalHabitaciones).toBe(5);
    expect(res.body.habitacionesDisponibles).toBe(5);
    expect(res.body.ingresosMes).toBe(0);
    expect(res.body.reservasRecientes).toEqual([]);
  });
});

// ─── GET /api/admin/calendar ──────────────────────────────────────────────────

describe("GET /api/admin/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult = [];
  });

  it("401 sin token", async () => {
    const res = await request(buildApp()).get("/api/admin/calendar");
    expect(res.status).toBe(401);
  });

  it("403 con token de cliente", async () => {
    const token = signToken({ id: "u1", email: "u@test.com", rol: "cliente" });
    const res = await request(buildApp())
      .get("/api/admin/calendar")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("200 retorna rooms y reservaciones vacíos (como admin)", async () => {
    const selectMock = vi.mocked(db.select as (...args: unknown[]) => unknown);
    selectMock
      .mockReturnValueOnce(makeChain([]))  // rooms
      .mockReturnValueOnce(makeChain([])); // reservations (vacío → no enrichment)

    const token = adminToken();
    const res = await request(buildApp())
      .get("/api/admin/calendar")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.rooms).toEqual([]);
    expect(res.body.reservations).toEqual([]);
    expect(res.body.desde).toBeDefined();
    expect(res.body.hasta).toBeDefined();
  });

  it("200 acepta parámetros desde/hasta", async () => {
    const selectMock = vi.mocked(db.select as (...args: unknown[]) => unknown);
    selectMock
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain([]));

    const token = adminToken();
    const res = await request(buildApp())
      .get("/api/admin/calendar?desde=2026-07-01&hasta=2026-07-31")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.desde).toBe("2026-07-01");
    expect(res.body.hasta).toBe("2026-07-31");
  });
});
