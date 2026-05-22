import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import bcrypt from "bcryptjs";

// ─── Mocks (deben definirse ANTES de los imports del módulo que los usa) ───────

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password_test"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

const mockSelectChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
};

const mockInsertChain = {
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([]),
};

vi.mock("@workspace/db", () => ({
  db: {
    select: vi.fn(() => mockSelectChain),
    insert: vi.fn(() => mockInsertChain),
  },
  usersTable: { email: "email", id: "id" },
  eq: vi.fn(),
}));

// ─── Imports post-mock ────────────────────────────────────────────────────────

import authRouter from "../../routes/auth.js";
import { signToken } from "../../middlewares/auth.js";

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const mockUser = {
  id: "uuid-123",
  nombre: "Juan Pérez",
  email: "juan@test.com",
  passwordHash: "hashed_password_test",
  telefono: null,
  rol: "cliente",
  activo: true,
  createdAt: new Date().toISOString(),
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", authRouter);
  return app;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectChain.from.mockReturnThis();
    mockSelectChain.where.mockReturnThis();
    mockSelectChain.limit.mockResolvedValue([]);
    mockInsertChain.values.mockReturnThis();
    mockInsertChain.returning.mockResolvedValue([mockUser]);
  });

  it("400 cuando faltan campos requeridos", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ email: "a@b.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
  });

  it("400 cuando el password tiene menos de 8 caracteres", async () => {
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ nombre: "Juan", email: "juan@test.com", password: "1234" });
    expect(res.status).toBe(400);
  });

  it("409 cuando el email ya está registrado", async () => {
    mockSelectChain.limit.mockResolvedValue([mockUser]);
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ nombre: "Juan", email: "juan@test.com", password: "password123" });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Conflict");
  });

  it("201 con token y usuario sin passwordHash al registrar correctamente", async () => {
    mockSelectChain.limit.mockResolvedValue([]);
    const res = await request(buildApp())
      .post("/api/auth/register")
      .send({ nombre: "Juan", email: "nuevo@test.com", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectChain.from.mockReturnThis();
    mockSelectChain.where.mockReturnThis();
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  it("400 cuando faltan email o password", async () => {
    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "a@b.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad Request");
  });

  it("401 cuando el usuario no existe", async () => {
    mockSelectChain.limit.mockResolvedValue([]);
    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "noexiste@test.com", password: "password123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("401 cuando el usuario está inactivo", async () => {
    mockSelectChain.limit.mockResolvedValue([{ ...mockUser, activo: false }]);
    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "juan@test.com", password: "password123" });
    expect(res.status).toBe(401);
  });

  it("401 cuando la contraseña es incorrecta", async () => {
    mockSelectChain.limit.mockResolvedValue([mockUser]);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "juan@test.com", password: "wrong_password" });
    expect(res.status).toBe(401);
  });

  it("200 con token y usuario sin passwordHash con credenciales correctas", async () => {
    mockSelectChain.limit.mockResolvedValue([mockUser]);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const res = await request(buildApp())
      .post("/api/auth/login")
      .send({ email: "juan@test.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(mockUser.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectChain.from.mockReturnThis();
    mockSelectChain.where.mockReturnThis();
  });

  it("401 sin token de autenticación", async () => {
    const res = await request(buildApp()).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("401 con token mal formado", async () => {
    const res = await request(buildApp())
      .get("/api/auth/me")
      .set("Authorization", "Bearer token.invalido");
    expect(res.status).toBe(401);
  });

  it("200 retorna usuario sin passwordHash con token válido", async () => {
    mockSelectChain.limit.mockResolvedValue([mockUser]);
    const token = signToken({ id: mockUser.id, email: mockUser.email, rol: mockUser.rol });
    const res = await request(buildApp())
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(mockUser.email);
    expect(res.body.passwordHash).toBeUndefined();
  });
});
