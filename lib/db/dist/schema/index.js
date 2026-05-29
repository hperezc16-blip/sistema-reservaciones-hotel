// ../../lib/db/src/schema/users.ts
import { pgTable, uuid, varchar, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
var rolEnum = pgEnum("rol", ["cliente", "admin"]);
var usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  rol: rolEnum("rol").notNull().default("cliente"),
  telefono: varchar("telefono", { length: 20 }),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});
var insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string().min(8)
});
var selectUserSchema = createSelectSchema(usersTable).omit({ passwordHash: true });

// ../../lib/db/src/schema/rooms.ts
import { pgTable as pgTable2, uuid as uuid2, varchar as varchar2, text, decimal, smallint, boolean as boolean2, timestamp as timestamp2, pgEnum as pgEnum2 } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema2, createSelectSchema as createSelectSchema2 } from "drizzle-zod";
var tipoHabitacionEnum = pgEnum2("tipo_habitacion", ["sencilla", "doble", "suite", "cabana"]);
var roomsTable = pgTable2("rooms", {
  id: uuid2("id").primaryKey().defaultRandom(),
  nombre: varchar2("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  tipo: tipoHabitacionEnum("tipo").notNull().default("sencilla"),
  precioNoche: decimal("precio_noche", { precision: 10, scale: 2 }).notNull(),
  capacidad: smallint("capacidad").notNull().default(2),
  imageUrl: varchar2("image_url", { length: 500 }),
  amenidades: text("amenidades"),
  activo: boolean2("activo").notNull().default(true),
  createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow()
});
var insertRoomSchema = createInsertSchema2(roomsTable).omit({ id: true, createdAt: true });
var selectRoomSchema = createSelectSchema2(roomsTable);

// ../../lib/db/src/schema/reservations.ts
import { pgTable as pgTable3, uuid as uuid3, decimal as decimal2, text as text2, timestamp as timestamp3, date, pgEnum as pgEnum3 } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema3, createSelectSchema as createSelectSchema3 } from "drizzle-zod";
var estadoReservaEnum = pgEnum3("estado_reserva", ["pendiente", "confirmada", "cancelada", "completada"]);
var reservationsTable = pgTable3("reservations", {
  id: uuid3("id").primaryKey().defaultRandom(),
  clienteId: uuid3("cliente_id").notNull().references(() => usersTable.id),
  habitacionId: uuid3("habitacion_id").notNull().references(() => roomsTable.id),
  fechaEntrada: date("fecha_entrada").notNull(),
  fechaSalida: date("fecha_salida").notNull(),
  precioTotal: decimal2("precio_total", { precision: 10, scale: 2 }).notNull(),
  estado: estadoReservaEnum("estado").notNull().default("pendiente"),
  estadoPago: text2("estado_pago").notNull().default("pendiente"),
  notas: text2("notas"),
  createdAt: timestamp3("created_at", { withTimezone: true }).notNull().defaultNow()
});
var insertReservationSchema = createInsertSchema3(reservationsTable).omit({ id: true, createdAt: true, clienteId: true });
var selectReservationSchema = createSelectSchema3(reservationsTable);
export {
  estadoReservaEnum,
  insertReservationSchema,
  insertRoomSchema,
  insertUserSchema,
  reservationsTable,
  rolEnum,
  roomsTable,
  selectReservationSchema,
  selectRoomSchema,
  selectUserSchema,
  tipoHabitacionEnum,
  usersTable
};
