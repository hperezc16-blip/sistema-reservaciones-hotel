// ../../lib/api-zod/src/generated/api.ts
import * as zod from "zod";
var HealthCheckResponse = zod.object({
  status: zod.string()
});
var registerBodyNombreMin = 2;
var registerBodyPasswordMin = 8;
var RegisterBody = zod.object({
  nombre: zod.string().min(registerBodyNombreMin),
  email: zod.string().email(),
  password: zod.string().min(registerBodyPasswordMin),
  telefono: zod.string().optional()
});
var LoginBody = zod.object({
  email: zod.string().email(),
  password: zod.string()
});
var LoginResponse = zod.object({
  token: zod.string(),
  user: zod.object({
    id: zod.string(),
    nombre: zod.string(),
    email: zod.string(),
    rol: zod.enum(["cliente", "admin"]),
    telefono: zod.string().nullish(),
    activo: zod.boolean(),
    createdAt: zod.string()
  })
});
var GetMeResponse = zod.object({
  id: zod.string(),
  nombre: zod.string(),
  email: zod.string(),
  rol: zod.enum(["cliente", "admin"]),
  telefono: zod.string().nullish(),
  activo: zod.boolean(),
  createdAt: zod.string()
});
var ListRoomsQueryParams = zod.object({
  fechaEntrada: zod.coerce.string().optional(),
  fechaSalida: zod.coerce.string().optional(),
  capacidad: zod.coerce.number().optional(),
  tipo: zod.coerce.string().optional()
});
var ListRoomsResponseItem = zod.object({
  id: zod.string(),
  nombre: zod.string(),
  descripcion: zod.string().nullish(),
  tipo: zod.enum(["sencilla", "doble", "suite", "cabana"]),
  precioNoche: zod.string(),
  capacidad: zod.number(),
  imageUrl: zod.string().nullish(),
  amenidades: zod.string().nullish(),
  activo: zod.boolean(),
  createdAt: zod.string()
});
var ListRoomsResponse = zod.array(ListRoomsResponseItem);
var CreateRoomBody = zod.object({
  nombre: zod.string(),
  descripcion: zod.string().optional(),
  tipo: zod.enum(["sencilla", "doble", "suite", "cabana"]),
  precioNoche: zod.string(),
  capacidad: zod.number(),
  imageUrl: zod.string().optional(),
  amenidades: zod.string().optional(),
  activo: zod.boolean().optional()
});
var GetRoomParams = zod.object({
  id: zod.coerce.string()
});
var GetRoomResponse = zod.object({
  id: zod.string(),
  nombre: zod.string(),
  descripcion: zod.string().nullish(),
  tipo: zod.enum(["sencilla", "doble", "suite", "cabana"]),
  precioNoche: zod.string(),
  capacidad: zod.number(),
  imageUrl: zod.string().nullish(),
  amenidades: zod.string().nullish(),
  activo: zod.boolean(),
  createdAt: zod.string()
});
var UpdateRoomParams = zod.object({
  id: zod.coerce.string()
});
var UpdateRoomBody = zod.object({
  nombre: zod.string(),
  descripcion: zod.string().optional(),
  tipo: zod.enum(["sencilla", "doble", "suite", "cabana"]),
  precioNoche: zod.string(),
  capacidad: zod.number(),
  imageUrl: zod.string().optional(),
  amenidades: zod.string().optional(),
  activo: zod.boolean().optional()
});
var UpdateRoomResponse = zod.object({
  id: zod.string(),
  nombre: zod.string(),
  descripcion: zod.string().nullish(),
  tipo: zod.enum(["sencilla", "doble", "suite", "cabana"]),
  precioNoche: zod.string(),
  capacidad: zod.number(),
  imageUrl: zod.string().nullish(),
  amenidades: zod.string().nullish(),
  activo: zod.boolean(),
  createdAt: zod.string()
});
var DeleteRoomParams = zod.object({
  id: zod.coerce.string()
});
var DeleteRoomResponse = zod.object({
  success: zod.boolean(),
  message: zod.string().optional()
});
var ListReservationsQueryParams = zod.object({
  estado: zod.coerce.string().optional()
});
var ListReservationsResponseItem = zod.object({
  id: zod.string(),
  clienteId: zod.string(),
  habitacionId: zod.string(),
  fechaEntrada: zod.string(),
  fechaSalida: zod.string(),
  precioTotal: zod.string(),
  estado: zod.enum(["confirmada", "cancelada", "completada"]),
  notas: zod.string().nullish(),
  createdAt: zod.string(),
  room: zod.object({
    id: zod.string(),
    nombre: zod.string(),
    descripcion: zod.string().nullish(),
    tipo: zod.enum(["sencilla", "doble", "suite", "cabana"]),
    precioNoche: zod.string(),
    capacidad: zod.number(),
    imageUrl: zod.string().nullish(),
    amenidades: zod.string().nullish(),
    activo: zod.boolean(),
    createdAt: zod.string()
  }),
  cliente: zod.object({
    id: zod.string(),
    nombre: zod.string(),
    email: zod.string(),
    rol: zod.enum(["cliente", "admin"]),
    telefono: zod.string().nullish(),
    activo: zod.boolean(),
    createdAt: zod.string()
  })
});
var ListReservationsResponse = zod.array(ListReservationsResponseItem);
var CreateReservationBody = zod.object({
  habitacionId: zod.string(),
  fechaEntrada: zod.coerce.date(),
  fechaSalida: zod.coerce.date(),
  notas: zod.string().optional()
});
var GetReservationParams = zod.object({
  id: zod.coerce.string()
});
var GetReservationResponse = zod.object({
  id: zod.string(),
  clienteId: zod.string(),
  habitacionId: zod.string(),
  fechaEntrada: zod.string(),
  fechaSalida: zod.string(),
  precioTotal: zod.string(),
  estado: zod.enum(["confirmada", "cancelada", "completada"]),
  notas: zod.string().nullish(),
  createdAt: zod.string(),
  room: zod.object({
    id: zod.string(),
    nombre: zod.string(),
    descripcion: zod.string().nullish(),
    tipo: zod.enum(["sencilla", "doble", "suite", "cabana"]),
    precioNoche: zod.string(),
    capacidad: zod.number(),
    imageUrl: zod.string().nullish(),
    amenidades: zod.string().nullish(),
    activo: zod.boolean(),
    createdAt: zod.string()
  }),
  cliente: zod.object({
    id: zod.string(),
    nombre: zod.string(),
    email: zod.string(),
    rol: zod.enum(["cliente", "admin"]),
    telefono: zod.string().nullish(),
    activo: zod.boolean(),
    createdAt: zod.string()
  })
});
var CancelReservationParams = zod.object({
  id: zod.coerce.string()
});
var CancelReservationResponse = zod.object({
  id: zod.string(),
  clienteId: zod.string(),
  habitacionId: zod.string(),
  fechaEntrada: zod.string(),
  fechaSalida: zod.string(),
  precioTotal: zod.string(),
  estado: zod.enum(["confirmada", "cancelada", "completada"]),
  notas: zod.string().nullish(),
  createdAt: zod.string(),
  room: zod.object({
    id: zod.string(),
    nombre: zod.string(),
    descripcion: zod.string().nullish(),
    tipo: zod.enum(["sencilla", "doble", "suite", "cabana"]),
    precioNoche: zod.string(),
    capacidad: zod.number(),
    imageUrl: zod.string().nullish(),
    amenidades: zod.string().nullish(),
    activo: zod.boolean(),
    createdAt: zod.string()
  }),
  cliente: zod.object({
    id: zod.string(),
    nombre: zod.string(),
    email: zod.string(),
    rol: zod.enum(["cliente", "admin"]),
    telefono: zod.string().nullish(),
    activo: zod.boolean(),
    createdAt: zod.string()
  })
});
var GetAdminStatsResponse = zod.object({
  totalReservaciones: zod.number(),
  reservacionesHoy: zod.number(),
  habitacionesDisponibles: zod.number(),
  totalHabitaciones: zod.number(),
  ingresosMes: zod.number(),
  ocupacionPorcentaje: zod.number(),
  reservasRecientes: zod.array(
    zod.object({
      id: zod.string(),
      clienteId: zod.string(),
      habitacionId: zod.string(),
      fechaEntrada: zod.string(),
      fechaSalida: zod.string(),
      precioTotal: zod.string(),
      estado: zod.enum(["confirmada", "cancelada", "completada"]),
      notas: zod.string().nullish(),
      createdAt: zod.string(),
      room: zod.object({
        id: zod.string(),
        nombre: zod.string(),
        descripcion: zod.string().nullish(),
        tipo: zod.enum(["sencilla", "doble", "suite", "cabana"]),
        precioNoche: zod.string(),
        capacidad: zod.number(),
        imageUrl: zod.string().nullish(),
        amenidades: zod.string().nullish(),
        activo: zod.boolean(),
        createdAt: zod.string()
      }),
      cliente: zod.object({
        id: zod.string(),
        nombre: zod.string(),
        email: zod.string(),
        rol: zod.enum(["cliente", "admin"]),
        telefono: zod.string().nullish(),
        activo: zod.boolean(),
        createdAt: zod.string()
      })
    })
  )
});

// ../../lib/api-zod/src/generated/types/publicUserRol.ts
var PublicUserRol = {
  cliente: "cliente",
  admin: "admin"
};

// ../../lib/api-zod/src/generated/types/reservationWithDetailsEstado.ts
var ReservationWithDetailsEstado = {
  confirmada: "confirmada",
  cancelada: "cancelada",
  completada: "completada"
};

// ../../lib/api-zod/src/generated/types/roomInputTipo.ts
var RoomInputTipo = {
  sencilla: "sencilla",
  doble: "doble",
  suite: "suite",
  cabana: "cabana"
};

// ../../lib/api-zod/src/generated/types/roomTipo.ts
var RoomTipo = {
  sencilla: "sencilla",
  doble: "doble",
  suite: "suite",
  cabana: "cabana"
};
export {
  CancelReservationParams,
  CancelReservationResponse,
  CreateReservationBody,
  CreateRoomBody,
  DeleteRoomParams,
  DeleteRoomResponse,
  GetAdminStatsResponse,
  GetMeResponse,
  GetReservationParams,
  GetReservationResponse,
  GetRoomParams,
  GetRoomResponse,
  HealthCheckResponse,
  ListReservationsQueryParams,
  ListReservationsResponse,
  ListReservationsResponseItem,
  ListRoomsQueryParams,
  ListRoomsResponse,
  ListRoomsResponseItem,
  LoginBody,
  LoginResponse,
  PublicUserRol,
  RegisterBody,
  ReservationWithDetailsEstado,
  RoomInputTipo,
  RoomTipo,
  UpdateRoomBody,
  UpdateRoomParams,
  UpdateRoomResponse,
  registerBodyNombreMin,
  registerBodyPasswordMin
};
