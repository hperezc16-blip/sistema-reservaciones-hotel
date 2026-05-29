import { useState } from "react";
import { useListReservations, getListReservationsQueryKey } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, XCircle, Clock, Receipt, Filter, Search,
  Mail, Printer, AlertCircle, CreditCard, Banknote
} from "lucide-react";

const IVA_RATE = 0.12;

type ReservationFull = {
  id: string;
  habitacionId: string;
  clienteId: string;
  fechaEntrada: string;
  fechaSalida: string;
  precioTotal: string;
  estado: string;
  estadoPago: string;
  notas?: string | null;
  createdAt: string;
  room?: { nombre: string; tipo: string; precioNoche: string } | null;
  cliente?: { nombre: string; email: string; telefono?: string | null } | null;
};

const ESTADO_BADGE: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pendiente: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  confirmada: { label: "Confirmada", cls: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
  completada: { label: "Completada", cls: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle },
  cancelada: { label: "Cancelada", cls: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
};

const PAGO_BADGE: Record<string, { label: string; cls: string }> = {
  pendiente: { label: "Sin pago", cls: "bg-gray-100 text-gray-600" },
  anticipo: { label: "Anticipo", cls: "bg-amber-100 text-amber-700" },
  pagado: { label: "Pagado", cls: "bg-green-100 text-green-700" },
};

const TABS = [
  { key: "", label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "confirmada", label: "Confirmadas" },
  { key: "completada", label: "Completadas" },
  { key: "cancelada", label: "Canceladas" },
];

function toLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

async function patchReservation(id: string, body: Record<string, string>) {
  const token = localStorage.getItem("hotel_token");
  const res = await fetch(`/api/reservations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Error al actualizar");
  return res.json();
}

function InvoiceModal({ res, onClose }: { res: ReservationFull; onClose: () => void }) {
  const entrada = toLocalDate(res.fechaEntrada);
  const salida = toLocalDate(res.fechaSalida);
  const nights = Math.max(1, Math.round((salida.getTime() - entrada.getTime()) / 86400000));
  const precioPorNoche = parseFloat(res.room?.precioNoche || "0");
  const subtotal = precioPorNoche * nights;
  const iva = subtotal * IVA_RATE;
  const total = parseFloat(res.precioTotal);
  const numFactura = `FAC-${res.id.substring(0, 8).toUpperCase()}`;
  const fechaFactura = format(parseISO(res.createdAt), "dd/MM/yyyy");

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6" id="invoice-content">
          <div className="flex items-start justify-between border-b pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#c0614a]">Hotel Los Volcanes</h1>
              <p className="text-sm text-gray-500 mt-1">Antigua Guatemala, Guatemala</p>
              <p className="text-sm text-gray-500">Tel: +502 7832-0000 | info@losvolcanes.gt</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">FACTURA</div>
              <div className="text-sm text-gray-500 mt-1">No. <span className="font-mono font-semibold text-gray-700">{numFactura}</span></div>
              <div className="text-sm text-gray-500">Fecha: {fechaFactura}</div>
              <div className={`mt-2 inline-block text-xs px-2 py-1 rounded-full font-semibold ${
                res.estadoPago === "pagado" ? "bg-green-100 text-green-700" :
                res.estadoPago === "anticipo" ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-600"
              }`}>
                {PAGO_BADGE[res.estadoPago]?.label || res.estadoPago}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Facturar a</h3>
              <p className="font-semibold text-gray-800">{res.cliente?.nombre || "N/A"}</p>
              <p className="text-sm text-gray-500">{res.cliente?.email || ""}</p>
              {res.cliente?.telefono && <p className="text-sm text-gray-500">{res.cliente.telefono}</p>}
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Datos de la Reservación</h3>
              <p className="text-sm text-gray-600">Ref: <span className="font-mono text-gray-800">#{res.id.substring(0, 8).toUpperCase()}</span></p>
              <p className="text-sm text-gray-600">Estado: <span className="font-semibold capitalize">{res.estado}</span></p>
            </div>
          </div>

          <table className="w-full text-sm mb-6 border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y">
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Descripción</th>
                <th className="text-center px-4 py-3 text-gray-600 font-semibold">Noches</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Precio/Noche</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-4">
                  <div className="font-semibold text-gray-800">{res.room?.nombre || "Habitación"}</div>
                  <div className="text-xs text-gray-500 capitalize">{res.room?.tipo} — {format(entrada, "dd/MM/yyyy")} → {format(salida, "dd/MM/yyyy")}</div>
                </td>
                <td className="text-center px-4 py-4 text-gray-700">{nights}</td>
                <td className="text-right px-4 py-4 text-gray-700">Q{precioPorNoche.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</td>
                <td className="text-right px-4 py-4 font-medium text-gray-800">Q{subtotal.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Q{subtotal.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IVA (12%)</span>
                <span>Q{iva.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-900">
                <span>TOTAL</span>
                <span className="text-[#c0614a]">Q{total.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {res.notas && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Notas</p>
              <p className="text-sm text-gray-600">{res.notas}</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-center text-xs text-gray-400">
            <p>Hotel Los Volcanes — Antigua Guatemala, Guatemala</p>
            <p>Gracias por su preferencia. Esta factura es un comprobante oficial de pago.</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={() => {
              const content = document.getElementById("invoice-content")?.innerHTML || "";
              const win = window.open("", "_blank");
              if (win) {
                win.document.write(`<html><head><title>Factura ${numFactura}</title><style>body{font-family:sans-serif;padding:24px;max-width:700px;margin:auto}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px}th{background:#f9fafb;text-align:left}@media print{button{display:none}}</style></head><body>${content}<br/><button onclick='window.print()'>Imprimir</button></body></html>`);
                win.document.close();
              }
            }}>
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => {
              const subject = encodeURIComponent(`Factura Hotel Los Volcanes - ${numFactura}`);
              const body = encodeURIComponent(`Estimado/a ${res.cliente?.nombre},\n\nAdjunto su factura ${numFactura}.\n\nFechas: ${format(entrada, "dd/MM/yyyy")} - ${format(salida, "dd/MM/yyyy")}\nTotal: Q${total.toFixed(2)}\n\nGracias por elegirnos.\n\nHotel Los Volcanes`);
              window.open(`mailto:${res.cliente?.email}?subject=${subject}&body=${body}`);
            }}>
              <Mail className="h-4 w-4" /> Enviar por Email
            </Button>
          </div>
          <Button size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}

export default function Reservations() {
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [invoiceRes, setInvoiceRes] = useState<ReservationFull | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useListReservations(
    {},
    { query: { queryKey: getListReservationsQueryKey({}) } }
  ) as { data: ReservationFull[] | undefined; isLoading: boolean };

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey({}) });

  const handleAction = async (id: string, body: Record<string, string>, successMsg: string) => {
    setLoadingAction(id + JSON.stringify(body));
    try {
      await patchReservation(id, body);
      toast({ title: successMsg });
      refresh();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoadingAction(null);
    }
  };

  const filtered = (reservations || []).filter(r => {
    const matchTab = !activeTab || r.estado === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.cliente?.nombre?.toLowerCase().includes(q) ||
      r.cliente?.email?.toLowerCase().includes(q) ||
      r.room?.nombre?.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const counts = TABS.map(t => ({
    key: t.key,
    label: t.label,
    count: t.key ? (reservations || []).filter(r => r.estado === t.key).length : (reservations || []).length,
  }));

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Gestión de Reservaciones</h1>
          <p className="text-muted-foreground mt-1">Confirme, registre pagos y emita facturas</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-muted/50 border px-4 py-2 rounded">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span>{filtered.length} reservaciones</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex border rounded overflow-hidden">
          {counts.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.key ? "bg-primary text-white" : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cliente, habitación..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-card border animate-pulse rounded" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border text-center py-16 rounded">
          <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay reservaciones que coincidan</p>
        </div>
      ) : (
        <div className="bg-card border shadow-sm rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b text-xs text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Ref.</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Habitación</th>
                  <th className="px-4 py-3 text-left">Fechas / Noches</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Pago</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(res => {
                  const badge = ESTADO_BADGE[res.estado] || ESTADO_BADGE.pendiente;
                  const Icon = badge.icon;
                  const pagoBadge = PAGO_BADGE[res.estadoPago] || PAGO_BADGE.pendiente;
                  const entrada = toLocalDate(res.fechaEntrada);
                  const salida = toLocalDate(res.fechaSalida);
                  const nights = Math.max(1, Math.round((salida.getTime() - entrada.getTime()) / 86400000));
                  const isActioning = loadingAction?.startsWith(res.id);

                  return (
                    <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{res.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{res.cliente?.nombre || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{res.cliente?.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{res.room?.nombre || "N/A"}</div>
                        <div className="text-xs text-muted-foreground capitalize">{res.room?.tipo}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>{format(entrada, "dd/MM/yyyy")} →</div>
                        <div>{format(salida, "dd/MM/yyyy")}</div>
                        <div className="text-muted-foreground">{nights} noche{nights !== 1 ? "s" : ""}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        Q{parseFloat(res.precioTotal).toLocaleString("es-GT", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 border rounded-full font-medium ${badge.cls}`}>
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${pagoBadge.cls}`}>
                          {pagoBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap justify-center">
                          {res.estado === "pendiente" && (
                            <Button size="sm" variant="outline" disabled={!!isActioning} className="h-7 px-2 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => handleAction(res.id, { estado: "confirmada" }, "Reservación confirmada")}>
                              <CheckCircle className="h-3 w-3" /> Confirmar
                            </Button>
                          )}
                          {res.estadoPago === "pendiente" && res.estado !== "cancelada" && (
                            <Button size="sm" variant="outline" disabled={!!isActioning} className="h-7 px-2 text-xs gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                              onClick={() => handleAction(res.id, { estadoPago: "anticipo" }, "Anticipo registrado")}>
                              <Banknote className="h-3 w-3" /> Anticipo
                            </Button>
                          )}
                          {res.estadoPago !== "pagado" && res.estado !== "cancelada" && (
                            <Button size="sm" variant="outline" disabled={!!isActioning} className="h-7 px-2 text-xs gap-1 text-blue-700 border-blue-300 hover:bg-blue-50"
                              onClick={() => handleAction(res.id, { estadoPago: "pagado", estado: res.estado === "pendiente" ? "confirmada" : res.estado }, "Pago completo registrado")}>
                              <CreditCard className="h-3 w-3" /> Pago Total
                            </Button>
                          )}
                          {res.estado === "confirmada" && (
                            <Button size="sm" variant="outline" disabled={!!isActioning} className="h-7 px-2 text-xs gap-1 text-blue-700 border-blue-300 hover:bg-blue-50"
                              onClick={() => handleAction(res.id, { estado: "completada" }, "Reservación completada")}>
                              <CheckCircle className="h-3 w-3" /> Completar
                            </Button>
                          )}
                          {res.estado !== "cancelada" && (
                            <Button size="sm" variant="outline" disabled={!!isActioning} className="h-7 px-2 text-xs gap-1 text-red-700 border-red-300 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`¿Cancelar reservación #${res.id.substring(0, 8).toUpperCase()}?`))
                                  handleAction(res.id, { estado: "cancelada" }, "Reservación cancelada");
                              }}>
                              <XCircle className="h-3 w-3" /> Cancelar
                            </Button>
                          )}
                          <Button size="sm" variant="outline" disabled={!!isActioning} className="h-7 px-2 text-xs gap-1"
                            onClick={() => setInvoiceRes(res)}>
                            <Receipt className="h-3 w-3" /> Factura
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invoiceRes && <InvoiceModal res={invoiceRes} onClose={() => setInvoiceRes(null)} />}
    </div>
  );
}
