import { describe, it, expect, vi } from "vitest";
import type { Response, NextFunction } from "express";
import {
  requireAuth,
  requireAdmin,
  signToken,
  type AuthRequest,
} from "../../middlewares/auth.js";

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeNext() {
  return vi.fn() as unknown as NextFunction;
}

// ─── signToken ────────────────────────────────────────────────────────────────

describe("signToken", () => {
  it("retorna un string JWT con 3 partes", () => {
    const token = signToken({ id: "1", email: "a@test.com", rol: "cliente" });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("el token incluye el payload correcto", () => {
    const payload = { id: "abc", email: "x@y.com", rol: "admin" };
    const token = signToken(payload);
    // El middleware mismoló verifica: si requireAuth acepta el token, el payload es correcto
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    requireAuth(req, makeRes(), makeNext());
    expect(req.user).toMatchObject(payload);
  });
});

// ─── requireAuth ─────────────────────────────────────────────────────────────

describe("requireAuth", () => {
  it("responde 401 cuando no hay header Authorization", () => {
    const req = { headers: {} } as AuthRequest;
    const res = makeRes();
    requireAuth(req, res, makeNext());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Unauthorized" })
    );
  });

  it("responde 401 cuando el header no empieza con 'Bearer '", () => {
    const req = {
      headers: { authorization: "Basic dXNlcjpwYXNz" },
    } as AuthRequest;
    const res = makeRes();
    requireAuth(req, res, makeNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("responde 401 con token manipulado / inválido", () => {
    const req = {
      headers: { authorization: "Bearer este.no.esvalido" },
    } as AuthRequest;
    const res = makeRes();
    requireAuth(req, res, makeNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("llama next() y asigna req.user con token válido", () => {
    const payload = { id: "u1", email: "user@test.com", rol: "cliente" };
    const token = signToken(payload);
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as AuthRequest;
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject(payload);
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─── requireAdmin ─────────────────────────────────────────────────────────────

describe("requireAdmin", () => {
  it("responde 403 cuando el usuario tiene rol 'cliente'", () => {
    const token = signToken({ id: "u1", email: "u@test.com", rol: "cliente" });
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as AuthRequest;
    const res = makeRes();
    const next = makeNext();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Forbidden" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("llama next() cuando el usuario tiene rol 'admin'", () => {
    const token = signToken({ id: "a1", email: "admin@test.com", rol: "admin" });
    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as AuthRequest;
    const res = makeRes();
    const next = makeNext();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responde 401 si no hay token (hereda requireAuth)", () => {
    const req = { headers: {} } as AuthRequest;
    const res = makeRes();
    requireAdmin(req, res, makeNext());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
