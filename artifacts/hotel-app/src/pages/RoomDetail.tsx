import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetRoom, useCreateReservation, getGetRoomQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Bed, Users, Wifi, Coffee, MapPin, CheckCircle2, Calendar, 
  CreditCard, ArrowLeft, ArrowRight, Check, Shield, Clock, Utensils, Car
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { differenceInDays, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

const schema = z.object({
  fechaEntrada: z.string().min(1, "Seleccione la fecha de llegada"),
  fechaSalida: z.string().min(1, "Seleccione la fecha de salida"),
  notas: z.string().optional(),
}).refine(d => !d.fechaEntrada || !d.fechaSalida || new Date(d.fechaSalida) > new Date(d.fechaEntrada), {
  message: "La fecha de salida debe ser posterior a la de llegada",
  path: ["fechaSalida"]
});

type FormValues = z.infer<typeof schema>;

const TIPO_LABEL: Record<string, string> = { sencilla: "Sencilla", doble: "Doble", suite: "Suite", cabana: "Cabana" };

const AMENITIES_DEFAULT = ["Aire acondicionado", "TV Smart 55\"", "Minibar", "Caja fuerte", "Bano privado", "Secadora de cabello", "Agua caliente 24h", "Vista panoramica"];

export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"details" | "payment" | "confirm">("details");
  const [confirmedRes, setConfirmedRes] = useState<any>(null);

  const { data: room, isLoading } = useGetRoom(
    id || "",
    { query: { enabled: !!id, queryKey: getGetRoomQueryKey(id!) } }
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fechaEntrada: "", fechaSalida: "", notas: "" },
  });

  const fechaEntrada = form.watch("fechaEntrada");
  const fechaSalida = form.watch("fechaSalida");

  let nights = 0;
  let subtotal = 0;
  let impuesto = 0;
  let total = 0;

  if (fechaEntrada && fechaSalida && room) {
    const start = parseISO(fechaEntrada);
    const end = parseISO(fechaSalida);
    if (end > start) {
      nights = differenceInDays(end, start);
      subtotal = nights * parseFloat(room.precioNoche);
      impuesto = subtotal * 0.12;
      total = subtotal + impuesto;
    }
  }

  const createRes = useCreateReservation({
    mutation: {
      onSuccess: (data) => {
        setConfirmedRes(data);
        setStep("confirm");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Error al reservar",
          description: error.response?.data?.message || "No se pudo procesar la reservacion.",
        });
      }
    }
  });

  const handleStepDetails = form.handleSubmit(() => {
    if (!user) {
      toast({ title: "Inicie sesion", description: "Debe iniciar sesion para reservar." });
      setLocation("/login");
      return;
    }
    setStep("payment");
  });

  const handleConfirmPayment = () => {
    if (!room) return;
    const values = form.getValues();
    createRes.mutate({
      data: {
        habitacionId: room.id,
        fechaEntrada: values.fechaEntrada,
        fechaSalida: values.fechaSalida,
        notas: values.notas,
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 animate-pulse">
        <div className="h-80 bg-muted mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 bg-muted w-2/3" />
            <div className="h-4 bg-muted w-1/4" />
            <div className="h-24 bg-muted mt-8" />
          </div>
          <div className="h-72 bg-muted" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="font-serif text-3xl mb-4">Habitacion no encontrada</h2>
        <Button onClick={() => setLocation("/rooms")}>Volver a Habitaciones</Button>
      </div>
    );
  }

  const imgUrl = room.imageUrl || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&h=600&fit=crop";
  const amenities = room.amenidades ? room.amenidades.split(",").map(a => a.trim()) : AMENITIES_DEFAULT;
  const today = new Date().toISOString().split("T")[0];

  // CONFIRMATION STEP
  if (step === "confirm" && confirmedRes) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="bg-card border max-w-lg w-full p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Reservacion Confirmada</h1>
          <p className="text-muted-foreground mb-6">Su habitacion ha sido reservada exitosamente. Le esperamos.</p>

          <div className="bg-muted rounded p-4 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Numero de reservacion</span>
              <span className="font-mono font-bold text-primary">#{confirmedRes.id?.slice(0, 8).toUpperCase() || "N/A"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Habitacion</span>
              <span className="font-semibold">{room.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Llegada</span>
              <span className="font-semibold">{format(parseISO(form.getValues("fechaEntrada")), "d 'de' MMMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Salida</span>
              <span className="font-semibold">{format(parseISO(form.getValues("fechaSalida")), "d 'de' MMMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Noches</span>
              <span className="font-semibold">{nights}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Total pagado</span>
              <span className="font-bold text-lg text-primary">Q{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800 mb-6 text-left">
            <p className="font-semibold mb-1">Informacion importante</p>
            <p>Check-in: 3:00 PM | Check-out: 12:00 PM</p>
            <p>Presentese con su DPI o pasaporte en recepcion.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => setLocation("/my-reservations")} className="flex-1 bg-primary text-white" data-testid="button-view-reservations">
              Ver Mis Reservaciones
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} className="flex-1">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background pb-24">
      {/* Hero */}
      <div className="w-full h-[50vh] min-h-[380px] relative">
        <img src={imgUrl} alt={room.nombre} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <button
          onClick={() => history.back()}
          className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <div className="absolute bottom-0 left-0 w-full p-8 container mx-auto">
          <span className="bg-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3 inline-block">
            {TIPO_LABEL[room.tipo] || room.tipo}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white">{room.nombre}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* LEFT: Room details */}
          <div className="lg:col-span-3 space-y-10">
            <div className="flex flex-wrap gap-6 text-muted-foreground border-b pb-8">
              <span className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Hasta {room.capacidad} personas</span>
              <span className="flex items-center gap-2"><Bed className="h-5 w-5 text-primary" /> {TIPO_LABEL[room.tipo] || room.tipo}</span>
              <span className="flex items-center gap-2"><Wifi className="h-5 w-5 text-primary" /> WiFi Gratis</span>
              <span className="flex items-center gap-2"><Coffee className="h-5 w-5 text-primary" /> Bar & Lounge</span>
              <span className="flex items-center gap-2"><Utensils className="h-5 w-5 text-primary" /> Restaurante</span>
              <span className="flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> Estacionamiento</span>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-semibold mb-4">Descripcion</h2>
              <p className="text-muted-foreground leading-relaxed text-lg font-light">
                {room.descripcion || "Una hermosa habitacion disenada para su confort y descanso. Disfrute de vistas espectaculares y un servicio excepcional en Hotel Los Volcanes."}
              </p>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-semibold mb-4">Amenidades incluidas</h2>
              <div className="grid grid-cols-2 gap-3">
                {amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted p-5 border-l-4 border-primary">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Politicas de la habitacion</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Check-in: 3:00 PM | Check-out: 12:00 PM</li>
                <li>No se permite fumar en interiores</li>
                <li>Mascotas aceptadas (cargo adicional de Q150/noche)</li>
                <li>Cancelacion gratuita con 48+ horas de anticipacion</li>
              </ul>
            </div>
          </div>

          {/* RIGHT: Booking form */}
          <div className="lg:col-span-2">
            <div className="bg-card border shadow-md sticky top-24">
              <div className="p-6 border-b bg-primary text-white">
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-4xl font-bold">Q{room.precioNoche}</span>
                  <span className="text-white/80 text-sm uppercase tracking-wider">por noche</span>
                </div>
              </div>

              {/* STEP INDICATOR */}
              {step === "payment" && (
                <div className="px-6 pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</div>
                    <div className="flex-1 h-0.5 bg-primary" />
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</div>
                    <div className="flex-1 h-0.5 bg-muted" />
                    <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-bold">3</div>
                  </div>
                  <p className="text-sm font-semibold text-primary mb-4">Paso 2: Simulacion de pago</p>
                </div>
              )}

              {step === "details" ? (
                <form onSubmit={handleStepDetails} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Llegada</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          min={today}
                          className="pl-10"
                          {...form.register("fechaEntrada")}
                          data-testid="input-check-in"
                        />
                      </div>
                      {form.formState.errors.fechaEntrada && (
                        <p className="text-xs text-destructive">{form.formState.errors.fechaEntrada.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Salida</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          min={fechaEntrada || today}
                          className="pl-10"
                          {...form.register("fechaSalida")}
                          data-testid="input-check-out"
                        />
                      </div>
                      {form.formState.errors.fechaSalida && (
                        <p className="text-xs text-destructive">{form.formState.errors.fechaSalida.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notas especiales (opcional)</Label>
                    <Textarea
                      placeholder="Llegada tarde, cuna para bebe, alergias..."
                      className="resize-none text-sm"
                      rows={3}
                      {...form.register("notas")}
                      data-testid="input-notes"
                    />
                  </div>

                  {nights > 0 && (
                    <div className="bg-muted p-4 space-y-2 text-sm border">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Q{room.precioNoche} × {nights} noches</span>
                        <span>Q{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>IVA (12%)</span>
                        <span>Q{impuesto.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-2 border-t">
                        <span>Total estimado</span>
                        <span className="text-primary">Q{total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white uppercase tracking-wide py-5 gap-2 text-sm font-semibold"
                    disabled={!room.activo}
                    data-testid="button-continue-payment"
                  >
                    {!room.activo ? "No disponible" : "Continuar al pago"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Shield className="h-3 w-3" /> Reservacion segura y sin cargos adicionales
                  </p>
                </form>
              ) : (
                <div className="p-6 space-y-4">
                  {/* Payment simulation */}
                  <p className="text-sm text-muted-foreground">Complete los datos de pago para confirmar su reservacion.</p>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nombre en la tarjeta</Label>
                      <Input placeholder="MARIA LOPEZ GARCIA" className="uppercase" data-testid="input-card-name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Numero de tarjeta</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="4242 4242 4242 4242" className="pl-10" maxLength={19} data-testid="input-card-number" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vencimiento</Label>
                        <Input placeholder="MM/AA" maxLength={5} data-testid="input-card-expiry" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">CVV</Label>
                        <Input placeholder="123" maxLength={4} type="password" data-testid="input-card-cvv" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 text-sm space-y-1 border">
                    <div className="flex justify-between text-muted-foreground">
                      <span>{room.nombre}</span>
                      <span>{nights} noche{nights !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal + IVA</span>
                      <span>Q{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>Cargo total</span>
                      <span className="text-primary">Q{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 rounded">
                    <strong>Modo demostracion:</strong> Este es un sistema educativo. No se realizara ningun cargo real.
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white uppercase tracking-wide py-5 gap-2 font-semibold"
                    onClick={handleConfirmPayment}
                    disabled={createRes.isPending}
                    data-testid="button-confirm-payment"
                  >
                    {createRes.isPending ? "Procesando..." : "Confirmar y Pagar"}
                    <Check className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setStep("details")}
                    data-testid="button-back-details"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Regresar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
