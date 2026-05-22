import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Users, Bed, CalendarDays, DollarSign, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetAdminStats(
    { query: { queryKey: getGetAdminStatsQueryKey() } }
  );

  if (isLoading || !stats) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 w-64 bg-muted mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card border"></div>)}
      </div>
    </div>;
  }

  const statCards = [
    {
      title: "Ocupación Hoy",
      value: `${stats.ocupacionPorcentaje.toFixed(0)}%`,
      subtitle: `${stats.habitacionesDisponibles} disp. de ${stats.totalHabitaciones}`,
      icon: TrendingUp,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Llegadas Hoy",
      value: stats.reservacionesHoy,
      subtitle: "Reservaciones activas",
      icon: CalendarDays,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    },
    {
      title: "Total Reservaciones",
      value: stats.totalReservaciones,
      subtitle: "Histórico general",
      icon: Bed,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Ingresos del Mes",
      value: `$${stats.ingresosMes.toLocaleString()}`,
      subtitle: "Últimos 30 días",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8 text-foreground">Panel de Control</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-card border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-3xl font-bold mt-1 mb-2">{stat.value}</h3>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Reservaciones Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Habitación</th>
                <th className="px-6 py-4 font-medium">Fechas</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.reservasRecientes.map((res) => (
                <tr key={res.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{res.cliente.nombre}</div>
                    <div className="text-muted-foreground text-xs">{res.cliente.email}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{res.room.nombre}</td>
                  <td className="px-6 py-4">
                    <div className="whitespace-nowrap">
                      {format(parseISO(res.fechaEntrada), "dd/MM/yyyy")} - {format(parseISO(res.fechaSalida), "dd/MM/yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs uppercase tracking-wider border rounded-full ${
                      res.estado === 'confirmada' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30' :
                      res.estado === 'cancelada' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30' :
                      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30'
                    }`}>
                      {res.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">${res.precioTotal}</td>
                </tr>
              ))}
              {stats.reservasRecientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No hay reservaciones recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
