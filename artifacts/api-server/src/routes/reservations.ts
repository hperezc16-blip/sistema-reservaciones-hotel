import { Router } from "express";
import { db } from "@workspace/db";
import { reservationsTable, roomsTable, usersTable } from "@workspace/db";
import { eq, and, or, lte, gte, ne, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

async function enrichReservation(r: typeof reservationsTable.$inferSelect) {
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, r.habitacionId)).limit(1);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.clienteId)).limit(1);
  const { passwordHash: _, ...publicUser } = user!;
  return { ...r, room, cliente: publicUser };
}

router.get("/reservations", requireAuth, async (req: AuthRequest, res) => {
  const { estado } = req.query as { estado?: string };
  const isAdmin = req.user!.rol === "admin";

  let query = db.select().from(reservationsTable).orderBy(desc(reservationsTable.createdAt));
  let reservations;

  if (isAdmin) {
    reservations = estado
      ? await db.select().from(reservationsTable).where(eq(reservationsTable.estado, estado as "confirmada" | "cancelada" | "completada")).orderBy(desc(reservationsTable.createdAt))
      : await db.select().from(reservationsTable).orderBy(desc(reservationsTable.createdAt));
  } else {
    reservations = estado
      ? await db.select().from(reservationsTable).where(and(eq(reservationsTable.clienteId, req.user!.id), eq(reservationsTable.estado, estado as "confirmada" | "cancelada" | "completada"))).orderBy(desc(reservationsTable.createdAt))
      : await db.select().from(reservationsTable).where(eq(reservationsTable.clienteId, req.user!.id)).orderBy(desc(reservationsTable.createdAt));
  }

  const enriched = await Promise.all(reservations.map(enrichReservation));
  res.json(enriched);
});

router.post("/reservations", requireAuth, async (req: AuthRequest, res) => {
  const { habitacionId, fechaEntrada, fechaSalida, notas } = req.body;
  if (!habitacionId || !fechaEntrada || !fechaSalida) {
    res.status(400).json({ error: "Bad Request", message: "habitacionId, fechaEntrada y fechaSalida son requeridos" });
    return;
  }

  const entradaDate = new Date(fechaEntrada);
  const salidaDate = new Date(fechaSalida);
  if (entradaDate >= salidaDate) {
    res.status(400).json({ error: "Bad Request", message: "La fecha de salida debe ser posterior a la de entrada" });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(and(eq(roomsTable.id, habitacionId), eq(roomsTable.activo, true))).limit(1);
  if (!room) {
    res.status(400).json({ error: "Bad Request", message: "Habitación no encontrada o no disponible" });
    return;
  }

  const conflicts = await db.select().from(reservationsTable).where(
    and(
      eq(reservationsTable.habitacionId, habitacionId),
      ne(reservationsTable.estado, "cancelada"),
      or(
        and(lte(reservationsTable.fechaEntrada, fechaEntrada), gte(reservationsTable.fechaSalida, fechaEntrada)),
        and(lte(reservationsTable.fechaEntrada, fechaSalida), gte(reservationsTable.fechaSalida, fechaSalida)),
        and(gte(reservationsTable.fechaEntrada, fechaEntrada), lte(reservationsTable.fechaSalida, fechaSalida))
      )
    )
  );

  if (conflicts.length > 0) {
    res.status(400).json({ error: "Conflict", message: "La habitación no está disponible en las fechas seleccionadas" });
    return;
  }

  const nights = Math.ceil((salidaDate.getTime() - entradaDate.getTime()) / (1000 * 60 * 60 * 24));
  const precioTotal = (parseFloat(room.precioNoche) * nights).toFixed(2);

  const [reservation] = await db.insert(reservationsTable).values({
    clienteId: req.user!.id,
    habitacionId,
    fechaEntrada,
    fechaSalida,
    precioTotal,
    notas: notas || null,
    estado: "confirmada",
  }).returning();

  const enriched = await enrichReservation(reservation);
  res.status(201).json(enriched);
});

router.get("/reservations/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id)).limit(1);
  if (!reservation) {
    res.status(404).json({ error: "Not Found", message: "Reserva no encontrada" });
    return;
  }
  if (req.user!.rol !== "admin" && reservation.clienteId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden", message: "No autorizado" });
    return;
  }
  const enriched = await enrichReservation(reservation);
  res.json(enriched);
});

router.patch("/reservations/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id)).limit(1);
  if (!reservation) {
    res.status(404).json({ error: "Not Found", message: "Reserva no encontrada" });
    return;
  }
  if (req.user!.rol !== "admin" && reservation.clienteId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden", message: "No autorizado" });
    return;
  }

  if (req.user!.rol === "admin") {
    const { estado, estadoPago, notas } = req.body as { estado?: string; estadoPago?: string; notas?: string };
    const validEstados = ["pendiente", "confirmada", "cancelada", "completada"];
    const validEstadosPago = ["pendiente", "anticipo", "pagado"];

    if (estado && !validEstados.includes(estado)) {
      res.status(400).json({ error: "Bad Request", message: "Estado inválido" });
      return;
    }
    if (estadoPago && !validEstadosPago.includes(estadoPago)) {
      res.status(400).json({ error: "Bad Request", message: "Estado de pago inválido" });
      return;
    }

    const updateFields: Record<string, string> = {};
    if (estado) updateFields["estado"] = estado;
    if (estadoPago) updateFields["estadoPago"] = estadoPago;
    if (notas !== undefined) updateFields["notas"] = notas;

    if (Object.keys(updateFields).length === 0) {
      res.status(400).json({ error: "Bad Request", message: "No se enviaron campos para actualizar" });
      return;
    }

    const [updated] = await db.update(reservationsTable)
      .set(updateFields as any)
      .where(eq(reservationsTable.id, id))
      .returning();

    const enriched = await enrichReservation(updated);
    res.json(enriched);
  } else {
    if (reservation.estado === "cancelada") {
      res.status(400).json({ error: "Bad Request", message: "La reserva ya está cancelada" });
      return;
    }
    const [updated] = await db.update(reservationsTable)
      .set({ estado: "cancelada" })
      .where(eq(reservationsTable.id, id))
      .returning();

    const enriched = await enrichReservation(updated);
    res.json(enriched);
  }
});

export default router;
