import { useEffect } from "react";
import { useListReservations, useCancelReservation, getListReservationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInDays, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Bed, Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const TIPO_LABEL: Record<string, string> = { sencilla: "Sencilla", doble: "Doble", suite: "Suite", cabana: "Cabana" };

function StatusBadge({ estado }: { estado: string }) {
  const cfg: Record<string, { icon: React.ElementType; label: string; class: string }> = {
    confirmada: { icon: CheckCircle, label: "Confirmada", class: "bg-green-100 text-green-800 border-green-200" },
    cancelada: { icon: XCircle, label: "Cancelada", class: "bg-red-100 text-red-800 border-red-200" },
    completada: { icon: CheckCircle, label: "Completada", class: "bg-blue-100 text-blue-800 border-blue-200" },
    pendiente: { icon: AlertCircle, label: "Pendiente", class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  };
  const s = cfg[estado] || { icon: AlertCircle, label: estado, class: "bg-gray-100 text-gray-800 border-gray-200" };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border rounded-full ${s.class}`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}

function TrackingBar({ estado, fechaEntrada, fechaSalida }: { estado: string; fechaEntrada: string; fechaSalida: string }) {
  if (estado === "cancelada") return null;

  const steps = [
    { label: "Reservado", done: true },
    { label: "Confirmado", done: estado === "confirmada" || estado === "completada" },
    { label: "Hospedaje", done: estado === "completada" || (estado === "confirmada" && !isFuture(parseISO(fechaEntrada))) },
    { label: "Completado", done: estado === "completada" || (estado === "confirmada" && isPast(parseISO(fechaSalida))) },
  ];

  return (
    <div className="flex items-center gap-0 mt-4">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${step.done ? "bg-primary border-primary text-white" : "border-muted-foreground/30 text-muted-foreground bg-background"}`}>
              {step.done ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap ${step.done ? "text-primary font-semibold" : "text-muted-foreground"}`}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 mx-1 ${steps[i + 1].done ? "bg-primary" : "bg-muted-foreground/20"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MyReservations() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const { data: reservations, isLoading } = useListReservations(
    {},
    { query: { enabled: !!user, queryKey: getListReservationsQueryKey({}) } }
  );

  const cancelMutation = useCancelReservation({
    mutation: {
      onSuccess: () => {
        toast({ title: "Reservacion cancelada", description: "Su reservacion fue cancelada exitosamente." });
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey({}) });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cancelar. Intente nuevamente." });
      }
    }
  });

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!user) return null;

  const handleCancel = (id: string, nombre: string) => {
    if (window.confirm(`¿Cancelar la reservacion de "${nombre}"? Si cancela dentro de las 48 horas, se aplicara un cargo de 1 noche.`)) {
      cancelMutation.mutate({ id });
    }
  };

  const activas = reservations?.filter(r => r.estado === "confirmada") || [];
  const pasadas = reservations?.filter(r => r.estado !== "confirmada") || [];

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-secondary text-secondary-foreground py-14">
        <div className="container mx-auto px-4">
          <p className="text-primary uppercase tracking-widest text-xs font-semibold mb-2">Mi cuenta</p>
          <h1 className="font-serif text-4xl font-bold">Mis Reservaciones</h1>
          <p className="text-secondary-foreground/70 mt-1">Gestione y realice seguimiento de sus estadias</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-44 bg-card border animate-pulse" />)}
          </div>
        ) : !reservations || reservations.length === 0 ? (
          <div className="text-center py-24 bg-card border">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-serif text-2xl mb-2">Aun no tiene reservaciones</h2>
            <p className="text-muted-foreground mb-6">Explore nuestras habitaciones y planee su proximo viaje.</p>
            <Link href="/rooms">
              <Button className="bg-primary text-white uppercase tracking-wide px-8 gap-2" data-testid="button-explore-rooms">
                <Plus className="h-4 w-4" /> Ver Habitaciones
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {activas.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl mb-5 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> Reservaciones Activas
                </h2>
                <div className="space-y-6">
                  {activas.map(res => (
                    <ReservationCard key={res.id} res={res} onCancel={handleCancel} cancelPending={cancelMutation.isPending} />
                  ))}
                </div>
              </div>
            )}

            {pasadas.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl mb-5 text-muted-foreground">Historial</h2>
                <div className="space-y-4">
                  {pasadas.map(res => (
                    <ReservationCard key={res.id} res={res} onCancel={handleCancel} cancelPending={cancelMutation.isPending} compact />
                  ))}
                </div>
              </div>
            )}

            <div className="text-center border-t pt-8">
              <Link href="/rooms">
                <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-white" data-testid="button-new-reservation">
                  <Plus className="h-4 w-4" /> Nueva Reservacion
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReservationCard({ res, onCancel, cancelPending, compact = false }: {
  res: any; onCancel: (id: string, nombre: string) => void; cancelPending: boolean; compact?: boolean;
}) {
  const entrada = parseISO(res.fechaEntrada);
  const salida = parseISO(res.fechaSalida);
  const nights = differenceInDays(salida, entrada);
  const imgUrl = res.room?.imageUrl || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&h=400&fit=crop";

  return (
    <div className={`bg-card border overflow-hidden ${compact ? "opacity-80" : "shadow-sm"}`} data-testid={`reservation-card-${res.id}`}>
      <div className="flex flex-col md:flex-row">
        {!compact && (
          <div className="md:w-44 h-36 md:h-auto shrink-0">
            <img src={imgUrl} alt={res.room?.nombre} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground">{res.room?.nombre}</h3>
              <p className="text-muted-foreground text-sm">
                {TIPO_LABEL[res.room?.tipo] || res.room?.tipo} — {res.room?.capacidad} personas
              </p>
            </div>
            <StatusBadge estado={res.estado} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary/70 shrink-0" />
              <span>{format(entrada, "d MMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary/70 shrink-0" />
              <span>{format(salida, "d MMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-primary/70 shrink-0" />
              <span>{nights} noche{nights !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {!compact && (
            <TrackingBar estado={res.estado} fechaEntrada={res.fechaEntrada} fechaSalida={res.fechaSalida} />
          )}

          {res.notas && (
            <p className="mt-3 text-sm text-muted-foreground italic bg-muted px-3 py-2">
              Notas: {res.notas}
            </p>
          )}

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div>
              <span className="text-muted-foreground text-xs">Total pagado</span>
              <p className="font-bold text-lg text-primary">Q{parseFloat(res.precioTotal).toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/rooms/${res.habitacionId}`}>
                <Button variant="outline" size="sm" className="text-xs uppercase tracking-wider" data-testid={`button-view-room-${res.id}`}>
                  Ver habitacion
                </Button>
              </Link>
              {res.estado === "confirmada" && isFuture(entrada) && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs uppercase tracking-wider"
                  onClick={() => onCancel(res.id, res.room?.nombre || "habitacion")}
                  disabled={cancelPending}
                  data-testid={`button-cancel-${res.id}`}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
