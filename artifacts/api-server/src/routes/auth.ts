import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken, type AuthRequest } from "../middlewares/auth.js";

const router: Router = Router();

router.post("/auth/register", async (req, res) => {
  const { nombre, email, password, telefono } = req.body;
  if (!nombre || !email || !password) {
    res.status(400).json({ error: "Bad Request", message: "nombre, email y password son requeridos" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Bad Request", message: "La contraseña debe tener al menos 8 caracteres" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Conflict", message: "El email ya está registrado" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    nombre,
    email,
    passwordHash,
    telefono: telefono || null,
    rol: "cliente",
  }).returning();

  const token = signToken({ id: user.id, email: user.email, rol: user.rol });
  const { passwordHash: _, ...publicUser } = user;

  res.status(201).json({ token, user: publicUser });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Bad Request", message: "email y password son requeridos" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.activo) {
    res.status(401).json({ error: "Unauthorized", message: "Credenciales incorrectas" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Unauthorized", message: "Credenciales incorrectas" });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, rol: user.rol });
  const { passwordHash: _, ...publicUser } = user;
  res.json({ token, user: publicUser });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Not Found", message: "Usuario no encontrado" });
    return;
  }
  const { passwordHash: _, ...publicUser } = user;
  res.json(publicUser);
});

export default router;
