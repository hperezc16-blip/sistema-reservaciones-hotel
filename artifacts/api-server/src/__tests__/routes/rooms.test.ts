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
  roomsTable: { id: "id", activo: "activo", tipo: "tipo", capacidad: "capacidad" },
  reservationsTable: {
    habitacionId: "habitacionId",
    estado: "estado",
    fechaEntrada: "fechaEntrada",
    fechaSalida: "fechaSalida",
  },
}));

// ─── Post-mock imports ────────────────────────────────────────────────────────

import roomsRouter from "../../routes/rooms.js";
import { signToken } from "../../middlewares/auth.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockRoom = {
  id: "room-1",
  nombre: "Suite Volcán",
  descripcion: "Vista panorámica",
  tipo: "suite",
  precioNoche: "350.00",
  capacidad: 2,
  imageUrl: null,
  amenidades: null,
  activo: true,
  createdAt: new Date().toISOString(),
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", roomsRouter);
  return app;
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

// ─── GET /api/rooms ───────────────────────────────────────────────────────────

describe("GET /api/rooms", () => {
  beforeEach(resetChains);

  it("200 retorna lista de habitaciones activas", async () => {
    mockSelectResult = [mockRoom];
    const res = await request(buildApp()).get("/api/rooms");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("room-1");
  });

  it("200 lista vacía cuando no hay habitaciones", async () => {
    mockSelectResult = [];
    const res = await request(buildApp()).get("/api/rooms");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("filtra por tipo en memoria", async () => {
    mockSelectResult = [
      mockRoom,
      { ...mockRoom, id: "room-2", tipo: "standard" },
    ];
    const res = await request(buildApp()).get("/api/rooms?tipo=suite");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe("suite");
  });

  it("filtra por capacidad en memoria", async () => {
    mockSelectResult = [
      { ...mockRoom, id: "room-a", capacidad: 2 },
      { ...mockRoom, id: "room-b", capacidad: 4 },
    ];
    const res = await request(buildApp()).get("/api/rooms?capacidad=3");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe("room-b");
  });
});

// ─── GET /api/rooms/:id ───────────────────────────────────────────────────────

describe("GET /api/rooms/:id", () => {
  beforeEach(resetChains);

  it("200 retorna habitación por id", async () => {
    mockSelectResult = [mockRoom];
    const res = await request(buildApp()).get("/api/rooms/room-1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("room-1");
  });

  it("404 cuando la habitación no existe", async () => {
    mockSelectResult = [];
    const res = await request(buildApp()).get("/api/rooms/inexistente");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
  });
});

// ─── POST /api/rooms ──────────────────────────────────────────────────────────

describe("POST /api/rooms", () => {
  beforeEach(resetChains);

  it("401 sin token de autenticación", async () => {
    const res = await request(buildApp())
      .post("/api/rooms")
      .send({ nombre: "Hab" });
    expect(res.status).toBe(401);
  });

  it("403 con token de cliente (solo admin puede crear)", async () => {
    const token = signToken({ id: "u1", email: "u@test.com", rol: "cliente" });
    const res = await request(buildApp())
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Hab", tipo: "suite", precioNoche: 100, capacidad: 2 });
    expect(res.status).toBe(403);
  });

  it("400 cuando faltan campos requeridos (como admin)", async () => {
    const token = adminToken();
    const res = await request(buildApp())
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Sin tipo" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
  });

  it("201 crea habitación correctamente (como admin)", async () => {
    mockInsertResult = [mockRoom];
    const token = adminToken();
    const res = await request(buildApp())
      .post("/api/rooms")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Suite Volcán", tipo: "suite", precioNoche: 350, capacidad: 2 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("room-1");
  });
});

// ─── PUT /api/rooms/:id ───────────────────────────────────────────────────────

describe("PUT /api/rooms/:id", () => {
  beforeEach(resetChains);

  it("401 sin token de autenticación", async () => {
    const res = await request(buildApp())
      .put("/api/rooms/room-1")
      .send({ nombre: "Nuevo" });
    expect(res.status).toBe(401);
  });

  it("404 cuando la habitación no existe (como admin)", async () => {
    mockUpdateResult = [];
    const token = adminToken();
    const res = await request(buildApp())
      .put("/api/rooms/inexistente")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "No existe" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not Found");
  });

  it("200 actualiza habitación (como admin)", async () => {
    mockUpdateResult = [{ ...mockRoom, nombre: "Suite Modificada" }];
    const token = adminToken();
    const res = await request(buildApp())
      .put("/api/rooms/room-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Suite Modificada" });
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Suite Modificada");
  });
});

// ─── DELETE /api/rooms/:id ────────────────────────────────────────────────────

describe("DELETE /api/rooms/:id", () => {
  beforeEach(resetChains);

  it("401 sin token de autenticación", async () => {
    const res = await request(buildApp()).delete("/api/rooms/room-1");
    expect(res.status).toBe(401);
  });

  it("200 desactiva habitación correctamente (como admin)", async () => {
    const token = adminToken();
    const res = await request(buildApp())
      .delete("/api/rooms/room-1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
