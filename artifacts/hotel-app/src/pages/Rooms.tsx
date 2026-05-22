import { useState } from "react";
import { Link, useSearch } from "wouter";
import { useListRooms } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Bed, SlidersHorizontal, Search, X } from "lucide-react";

const TIPO_LABEL: Record<string, string> = { sencilla: "Sencilla", doble: "Doble", suite: "Suite", cabana: "Cabana" };

export default function Rooms() {
  const search = useSearch();
  const urlParams = new URLSearchParams(search);

  const [filters, setFilters] = useState({
    tipo: urlParams.get("tipo") || "all",
    capacidad: urlParams.get("capacidad") || "",
    fechaEntrada: urlParams.get("fechaEntrada") || "",
    fechaSalida: urlParams.get("fechaSalida") || "",
  });
  const [activeFilters, setActiveFilters] = useState({ ...filters });

  const queryParams: Record<string, any> = {};
  if (activeFilters.tipo !== "all") queryParams.tipo = activeFilters.tipo;
  if (activeFilters.capacidad) queryParams.capacidad = parseInt(activeFilters.capacidad);
  if (activeFilters.fechaEntrada) queryParams.fechaEntrada = activeFilters.fechaEntrada;
  if (activeFilters.fechaSalida) queryParams.fechaSalida = activeFilters.fechaSalida;

  const { data: rooms, isLoading } = useListRooms(queryParams, {
    query: { queryKey: ["rooms", JSON.stringify(queryParams)] }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({ ...filters });
  };

  const handleReset = () => {
    const empty = { tipo: "all", capacidad: "", fechaEntrada: "", fechaSalida: "" };
    setFilters(empty);
    setActiveFilters(empty);
  };

  const nights = activeFilters.fechaEntrada && activeFilters.fechaSalida
    ? Math.ceil((new Date(activeFilters.fechaSalida).getTime() - new Date(activeFilters.fechaEntrada).getTime()) / 86400000)
    : 0;

  const hasFilters = activeFilters.tipo !== "all" || activeFilters.capacidad || activeFilters.fechaEntrada;
  const today = new Date().toISOString().split("T")[0];

  const availableRooms = rooms?.filter(r => r.activo) || [];

  return (
    <div className="bg-background min-h-screen">
      <div className="relative h-52 bg-secondary flex items-end overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&h=400&fit=crop"
          alt="Habitaciones del hotel"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="container mx-auto px-4 pb-10 relative z-10">
          <p className="text-primary uppercase tracking-widest text-xs font-semibold mb-2">Hospedaje de lujo</p>
          <h1 className="font-serif text-4xl font-bold text-secondary-foreground">Nuestras Habitaciones</h1>
          <p className="text-secondary-foreground/70 mt-1">Encuentre el espacio perfecto para su estadia</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="bg-card border p-5 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm uppercase tracking-wider text-foreground">Filtrar disponibilidad</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Llegada</Label>
              <Input
                type="date"
                min={today}
                value={filters.fechaEntrada}
                onChange={e => setFilters(f => ({ ...f, fechaEntrada: e.target.value }))}
                data-testid="filter-check-in"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Salida</Label>
              <Input
                type="date"
                min={filters.fechaEntrada || today}
                value={filters.fechaSalida}
                onChange={e => setFilters(f => ({ ...f, fechaSalida: e.target.value }))}
                data-testid="filter-check-out"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Huespedes</Label>
              <Input
                type="number" min={1} max={10} placeholder="Personas"
                value={filters.capacidad}
                onChange={e => setFilters(f => ({ ...f, capacidad: e.target.value }))}
                data-testid="filter-guests"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</Label>
              <Select value={filters.tipo} onValueChange={v => setFilters(f => ({ ...f, tipo: v }))}>
                <SelectTrigger data-testid="filter-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="sencilla">Sencilla</SelectItem>
                  <SelectItem value="doble">Doble</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="cabana">Cabana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-primary text-white uppercase tracking-wide gap-2" data-testid="button-apply-filters">
                <Search className="h-4 w-4" /> Buscar
              </Button>
              {hasFilters && (
                <Button type="button" variant="outline" size="icon" onClick={handleReset} data-testid="button-clear-filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {nights > 0 && (
            <p className="mt-3 text-sm text-muted-foreground pt-3 border-t">
              Mostrando disponibilidad para <strong>{nights}</strong> noche{nights !== 1 ? "s" : ""} — del {activeFilters.fechaEntrada} al {activeFilters.fechaSalida}
            </p>
          )}
        </form>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-muted animate-pulse" />)}
          </div>
        ) : availableRooms.length === 0 ? (
          <div className="text-center py-24 bg-card border">
            <Bed className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-serif text-2xl mb-2">No hay habitaciones disponibles</h3>
            <p className="text-muted-foreground mb-6">Pruebe con otros filtros o fechas diferentes.</p>
            <Button variant="outline" onClick={handleReset}>Quitar filtros</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{availableRooms.length} habitacion{availableRooms.length !== 1 ? "es" : ""} disponible{availableRooms.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRooms.map(room => (
                <Link key={room.id} href={`/rooms/${room.id}`} data-testid={`card-room-${room.id}`}>
                  <div className="group bg-card border overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={room.imageUrl || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop"}
                        alt={room.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                        {TIPO_LABEL[room.tipo] || room.tipo}
                      </div>
                      {nights > 0 && (
                        <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-2 py-1">
                          Disponible
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-serif text-lg font-semibold mb-1 text-foreground">{room.nombre}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">{room.descripcion}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {room.capacidad} persona{room.capacidad !== 1 ? "s" : ""}</span>
                        <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {TIPO_LABEL[room.tipo] || room.tipo}</span>
                      </div>
                      <div className="border-t pt-4 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xl text-primary">Q{room.precioNoche}</span>
                          <span className="text-muted-foreground text-xs ml-1">/ noche</span>
                          {nights > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Total: <strong className="text-foreground">Q{(parseFloat(room.precioNoche) * nights).toLocaleString()}</strong>
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-primary font-semibold uppercase tracking-wider">Ver mas →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
