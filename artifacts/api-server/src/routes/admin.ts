import { Router } from "express";
import { db } from "@workspace/db";
import { reservationsTable, roomsTable, usersTable } from "@workspace/db";
import { eq, count, and, gte, lte, ne, sql, desc } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router: Router = Router();

router.get("/admin/stats", requireAdmin, async (req: AuthRequest, res) => {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [totalRes] = await db.select({ count: count() }).from(reservationsTable);
  const [resHoy] = await db.select({ count: count() }).from(reservationsTable)
    .where(and(eq(reservationsTable.fechaEntrada, today), ne(reservationsTable.estado, "cancelada")));
  const [totalRooms] = await db.select({ count: count() }).from(roomsTable).where(eq(roomsTable.activo, true));

  const occupiedToday = await db.select({ id: reservationsTable.habitacionId }).from(reservationsTable)
    .where(and(
      ne(reservationsTable.estado, "cancelada"),
      lte(reservationsTable.fechaEntrada, today),
      gte(reservationsTable.fechaSalida, today)
    ));
  const occupiedSet = new Set(occupiedToday.map(r => r.id));
  const habitacionesDisponibles = (totalRooms.count as number) - occupiedSet.size;

  const ingresosResult = await db.select({ total: sql<number>`SUM(CAST(precio_total AS DECIMAL))` })
    .from(reservationsTable)
    .where(and(
      ne(reservationsTable.estado, "cancelada"),
      gte(reservationsTable.createdAt, new Date(firstOfMonth))
    ));

  const reservasRecientes = await db.select().from(reservationsTable)
    .orderBy(desc(reservationsTable.createdAt))
    .limit(5);

  const enriched = await Promise.all(reservasRecientes.map(async (r) => {
    const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, r.habitacionId)).limit(1);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.clienteId)).limit(1);
    const { passwordHash: _, ...publicUser } = user!;
    return { ...r, room, cliente: publicUser };
  }));

  const total = totalRooms.count as number;
  const ocupacion = total > 0 ? Math.round((occupiedSet.size / total) * 100) : 0;

  res.json({
    totalReservaciones: Number(totalRes.count),
    reservacionesHoy: Number(resHoy.count),
    habitacionesDisponibles,
    totalHabitaciones: total,
    ingresosMes: Number(ingresosResult[0]?.total ?? 0),
    ocupacionPorcentaje: ocupacion,
    reservasRecientes: enriched,
  });
});

router.get("/admin/calendar", requireAdmin, async (req: AuthRequest, res) => {
  const { desde, hasta } = req.query as { desde?: string; hasta?: string };

  const today = new Date();
  const startDate = desde || today.toISOString().split("T")[0];
  const endOfRange = new Date(today);
  endOfRange.setDate(endOfRange.getDate() + 29);
  const endDate = hasta || endOfRange.toISOString().split("T")[0];

  const rooms = await db.select().from(roomsTable).where(eq(roomsTable.activo, true));

  const reservations = await db.select().from(reservationsTable).where(
    and(
      ne(reservationsTable.estado, "cancelada"),
      lte(reservationsTable.fechaEntrada, endDate),
      gte(reservationsTable.fechaSalida, startDate)
    )
  );

  const enrichedReservations = await Promise.all(reservations.map(async (r) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, r.clienteId)).limit(1);
    const { passwordHash: _, ...publicUser } = user!;
    return { ...r, cliente: publicUser };
  }));

  res.json({
    rooms: rooms.map(r => ({ id: r.id, nombre: r.nombre, tipo: r.tipo, precioNoche: r.precioNoche })),
    reservations: enrichedReservations,
    desde: startDate,
    hasta: endDate,
  });
});

export default router;
