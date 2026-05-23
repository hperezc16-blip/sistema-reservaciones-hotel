import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// ─── Mutable state ────────────────────────────────────────────────────────────

let mockSelectResult: unknown[] = [];
let mockInsertResult: unknown[] = [];
let mockUpdateResult: unknown[] = [];

// ─── Thenable mock chains ─────────────────────────────────────────────────────

const mockSelectChain: any = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
    return Promise.resolve(mockSelectResult).then(resolve as never, reject as never);
  },
};

const mockInsertChain: any = {
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
    return Promise.resolve(mockInsertResult).then(resolve as never, reject as never);
  },
};

const mockUpdateChain: any = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
    return Promise.resolve(mockUpdateResult).then(resolve as never, reject as never);
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
    insert: vi.fn(() => mockInsertChain),
    update: vi.fn(() => mockUpdateChain),
  },
  reservationsTable: {
    id: "id",
    clienteId: "clienteId",
    habitacionId: "habitacionId",
    estado: "estado",
    estadoPago: "estadoPago",
    fechaEntrada: "fechaEntrada",
    fechaSalida: "fechaSalida",
    precioTotal: "precioTotal",
    notas: "notas",
    createdAt: "createdAt",
  },
  roomsTable: { id: "id", activo: "activo" },
  usersTable: { id: "id", email: "email" },
}));

// ─── Post-mock imports ────────────────────────────────────────────────────────

import reservationsRouter from "../../routes/reservations.js";
import { signToken } from "../../middlewares/auth.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockReservation = {
  id: "res-1",
  clienteId: "user-1",
  habitacionId: "room-1",
  fechaEntrada: "2026-06-01",
  fechaSalida: "2026-06-03",
  precioTotal: "700.00",
  estado: "confirmada",
  estadoPago: "pendiente",
  notas: null,
  createdAt: new Date().toISOString(),
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", reservationsRouter);
  return app;
}

function clientToken() {
  return signToken({ id: "user-1", email: "user@test.com", rol: "cliente" });
}

function adminToken() {
  return signToken({ id: "admin-1", email: "admin@test.com", rol: "admin" });
}

function resetChains() {
  vi.clearAllMocks();
  mockSelectResult = [];
  mockInsertResult = [];
  mockUpdateResult = [];
  mockSelectChain.from.mockReturnThis();
  mockSelectChain.where.mockReturnThis();
  mockSelectChain.limit.mockReturnThis();
  mockSelectChain.orderBy.mockReturnThis();
  mockInsertChain.values.mockReturnThis();
  mockInsertChain.returning.mockReturnThis();
  mockUpdateChain.set.mockReturnThis();
  mockUpdateChain.where.mockReturnThis();
  mockUpdateChain.returning.mockReturnThis();
}

// ─── GET /api/reservations ────────────────────────────────────────────────────

describe("GET /api/reservations", () => {
  beforeEach(resetChains);

  it("401 sin token", async () => {
    const res = await request(buildApp()).get("/api/reservations");
    expect(res.status).toBe(401);
  });

  it("200 [] como admin sin reservaciones", async () => {
    mockSelectResult = [];
    const token = adminToken();
    const res = await request(buildApp())
      .get("/api/reservations")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("200 [] como admin filtrando por estado", async () => {
    mockSelectResult = [];
    const token = adminToken();
    const res = await request(buildApp())
      .get("/api/reservations?estado=confirmada")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("200 [] como cliente sin reservaciones", async () => {
    mockSelectResult = [];
    const token = clientToken();
    const res = await request(buildApp())
      .get("/api/reservations")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("200 [] como cliente filtrando por estado", async () => {
    mockSelectResult = [];
    const token = clientToken();
    const res = await request(buildApp())
      .get("/api/reservations?estado=cancelada")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── POST /api/reservations ───────────────────────────────────────────────────

describe("POST /api/reservations", () => {
  beforeEach(resetChains);

  it("401 sin token", async () => {
    const res = await request(buildApp())
      .post("/api/reservations")
      .send({ habitacionId: "room-1", fechaEntrada: "2026-06-01", fechaSalida: "2026-06-03" });
    expect(res.status).toBe(401);
  });

  it("400 cuando faltan campos requeridos", async () => {
    const token = clientToken();
    const res = await request(buildApp())
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({ habitacionId: "room-1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
  });

  it("400 cuando fechaSalida es igual a fechaEntrada", async () => {
    const token = clientToken();
    const res = await request(buildApp())
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({ habitacionId: "room-1", fechaEntrada: "2026-06-01", fechaSalida: "2026-06-01" });
    expect(res.status).toBe(400);
  });

  it("400 cuando fechaSalida es anterior a fechaEntrada", async () => {
    const token = clientToken();
    const res = await request(buildApp())
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({ habitacionId: "room-1", fechaEntrada: "2026-06-05", fechaSalida: "2026-06-01" });
    expect(res.status).toBe(400);
  });

  it("400 cuando la habitación no existe o no está activa", async () => {
    mockSelectResult = [];
    const token = clientToken();
    const res = await request(buildApp())
      .post("/api/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({ habitacionId: "inexistente", fechaEntrada: "2026-06-01", fechaSalida: "2026-06-03" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("no encontrada");
  });
});

// ─── GET /api/reservations/:id ────────────────────────────────────────────────

describe("GET /api/reservations/:id", () => {
  beforeEach(resetChains);

  it("401 sin token", async () => {
    const res = await request(buildApp()).get("/api/reservations/res-1");
    expect(res.status).toBe(401);
  });

  it("404 cuando la reserva no existe", async () => {
    mockSelectResult = [];
    const token = adminToken();
    const res = await request(buildApp())
      .get("/api/reservations/inexistente")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
  });

  it("403 cuando cliente intenta ver reserva de otro usuario", async () => {
    mockSelectResult = [{ ...mockReservation, clienteId: "otro-user" }];
    const token = clientToken();
    const res = await request(buildApp())
      .get("/api/reservations/res-1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });
});

// ─── PATCH /api/reservations/:id ─────────────────────────────────────────────

describe("PATCH /api/reservations/:id", () => {
  beforeEach(resetChains);

  it("401 sin token", async () => {
    const res = await request(buildApp())
      .patch("/api/reservations/res-1")
      .send({ estado: "cancelada" });
    expect(res.status).toBe(401);
  });

  it("404 cuando la reserva no existe", async () => {
    mockSelectResult = [];
    const token = adminToken();
    const res = await request(buildApp())
      .patch("/api/reservations/inexistente")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "cancelada" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
  });

  it("403 cuando cliente intenta modificar reserva de otro usuario", async () => {
    mockSelectResult = [{ ...mockReservation, clienteId: "otro-user" }];
    const token = clientToken();
    const res = await request(buildApp())
      .patch("/api/reservations/res-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "cancelada" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  it("400 admin: estado inválido", async () => {
    mockSelectResult = [mockReservation];
    const token = adminToken();
    const res = await request(buildApp())
      .patch("/api/reservations/res-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "invalido" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
  });

  it("400 admin: estadoPago inválido", async () => {
    mockSelectResult = [mockReservation];
    const token = adminToken();
    const res = await request(buildApp())
      .patch("/api/reservations/res-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ estadoPago: "invalido" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
  });

  it("400 admin: sin campos para actualizar", async () => {
    mockSelectResult = [mockReservation];
    const token = adminToken();
    const res = await request(buildApp())
      .patch("/api/reservations/res-1")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("400 cliente: reserva ya cancelada", async () => {
    mockSelectResult = [{ ...mockReservation, clienteId: "user-1", estado: "cancelada" }];
    const token = clientToken();
    const res = await request(buildApp())
      .patch("/api/reservations/res-1")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("cancelada");
  });
});
