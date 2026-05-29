import { Router } from "express";
import { db } from "@workspace/db";
import { roomsTable, reservationsTable } from "@workspace/db";
import { eq, and, or, lte, gte, ne } from "drizzle-orm";
import { requireAdmin, requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: Router = Router();

router.get("/rooms", async (req, res) => {
  const { fechaEntrada, fechaSalida, capacidad, tipo } = req.query as Record<string, string>;

  let rooms = await db.select().from(roomsTable).where(eq(roomsTable.activo, true));

  if (tipo) rooms = rooms.filter(r => r.tipo === tipo);
  if (capacidad) rooms = rooms.filter(r => r.capacidad >= parseInt(capacidad));

  if (fechaEntrada && fechaSalida) {
    const occupiedIds = await db
      .select({ id: reservationsTable.habitacionId })
      .from(reservationsTable)
      .where(
        and(
          ne(reservationsTable.estado, "cancelada"),
          or(
            and(lte(reservationsTable.fechaEntrada, fechaEntrada), gte(reservationsTable.fechaSalida, fechaEntrada)),
            and(lte(reservationsTable.fechaEntrada, fechaSalida), gte(reservationsTable.fechaSalida, fechaSalida)),
            and(gte(reservationsTable.fechaEntrada, fechaEntrada), lte(reservationsTable.fechaSalida, fechaSalida))
          )
        )
      );
    const occupiedSet = new Set(occupiedIds.map(r => r.id));
    rooms = rooms.filter(r => !occupiedSet.has(r.id));
  }

  res.json(rooms);
});

router.post("/rooms", requireAdmin, async (req: AuthRequest, res) => {
  const { nombre, descripcion, tipo, precioNoche, capacidad, imageUrl, amenidades } = req.body;
  if (!nombre || !tipo || !precioNoche || !capacidad) {
    res.status(400).json({ error: "Bad Request", message: "Faltan campos requeridos" });
    return;
  }
  const [room] = await db.insert(roomsTable).values({
    nombre,
    descripcion: descripcion || null,
    tipo,
    precioNoche: String(precioNoche),
    capacidad: Number(capacidad),
    imageUrl: imageUrl || null,
    amenidades: amenidades || null,
  }).returning();
  res.status(201).json(room);
});

router.get("/rooms/:id", async (req, res) => {
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, req.params.id)).limit(1);
  if (!room) {
    res.status(404).json({ error: "Not Found", message: "Habitación no encontrada" });
    return;
  }
  res.json(room);
});

router.put("/rooms/:id", requireAdmin, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const { nombre, descripcion, tipo, precioNoche, capacidad, imageUrl, amenidades, activo } = req.body;
  const [room] = await db.update(roomsTable)
    .set({
      nombre,
      descripcion: descripcion ?? null,
      tipo,
      precioNoche: precioNoche ? String(precioNoche) : undefined,
      capacidad: capacidad ? Number(capacidad) : undefined,
      imageUrl: imageUrl ?? null,
      amenidades: amenidades ?? null,
      activo: activo !== undefined ? Boolean(activo) : undefined,
    })
    .where(eq(roomsTable.id, id))
    .returning();
  if (!room) {
    res.status(404).json({ error: "Not Found", message: "Habitación no encontrada" });
    return;
  }
  res.json(room);
});

router.delete("/rooms/:id", requireAdmin, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  await db.update(roomsTable).set({ activo: false }).where(eq(roomsTable.id, id));
  res.json({ success: true, message: "Habitación desactivada" });
});

export default router;
