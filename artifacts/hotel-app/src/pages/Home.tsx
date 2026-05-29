import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListRooms } from "@workspace/api-client-react";
import { 
  Wifi, Coffee, Car, Utensils, Waves, Dumbbell, Shield, Clock, 
  Phone, Mail, MapPin, ChevronDown, ChevronUp, Star, Check, Trees, Mountain
} from "lucide-react";

const SERVICES = [
  { icon: Wifi, title: "WiFi Gratis", desc: "Conectividad de alta velocidad en todas las instalaciones" },
  { icon: Utensils, title: "Restaurante", desc: "Cocina guatemalteca e internacional de autor, open 6am–10pm" },
  { icon: Coffee, title: "Bar & Lounge", desc: "Tragos artesanales, cervezas locales y vinos selectos" },
  { icon: Waves, title: "Piscina", desc: "Piscina climatizada con vista a los volcanes" },
  { icon: Dumbbell, title: "Gimnasio", desc: "Equipado con máquinas modernas, open 5am–11pm" },
  { icon: Car, title: "Estacionamiento", desc: "Parqueo privado techado con vigilancia 24 horas" },
  { icon: Shield, title: "Seguridad 24/7", desc: "Personal de seguridad y cámaras en todo el perímetro" },
  { icon: Clock, title: "Recepción 24/7", desc: "Asistencia y check-in disponibles a cualquier hora" },
];

const GALLERY = [
  "https://images.unsplash.com/photo-1542314831-c53cd4b85ca4?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&h=600&fit=crop",
];

const FAQS = [
  {
    q: "¿Cuál es el horario de check-in y check-out?",
    a: "El check-in es a partir de las 3:00 PM y el check-out es antes de las 12:00 PM (mediodía). Puede solicitar early check-in o late check-out sujeto a disponibilidad con costo adicional."
  },
  {
    q: "¿Se permiten mascotas?",
    a: "Sí, aceptamos mascotas pequeñas (hasta 10 kg) en habitaciones seleccionadas. Se aplica un cargo adicional de Q150 por noche. Debe indicarlo al momento de la reservación."
  },
  {
    q: "¿Cómo puedo cancelar mi reservación?",
    a: "Las cancelaciones realizadas con más de 48 horas de anticipación son sin cargo. Las cancelaciones dentro de las 48 horas tienen un cargo equivalente a 1 noche de estadía. Puede gestionar sus reservaciones desde su cuenta."
  },
  {
    q: "¿El hotel ofrece transporte desde el aeropuerto?",
    a: "Sí, ofrecemos servicio de transfer desde el Aeropuerto Internacional La Aurora y desde Antigua Guatemala con reservación previa. Consúltenos por disponibilidad y tarifas."
  },
  {
    q: "¿El desayuno está incluido?",
    a: "El desayuno buffet está incluido en las habitaciones Suite y Cabaña. Para habitaciones Sencilla y Doble, se puede agregar el plan de desayuno por Q85 por persona por día."
  },
  {
    q: "¿Hay opciones para grupos o eventos?",
    a: "Sí, contamos con salón de eventos para hasta 80 personas, ideal para bodas, quinceañeras, conferencias y eventos corporativos. Contáctenos para cotizaciones personalizadas."
  },
];

const REVIEWS = [
  { name: "María Rodríguez", rating: 5, comment: "Una experiencia increíble. Las vistas a los volcanes son impresionantes y el servicio es de primera clase.", date: "Enero 2026" },
  { name: "Carlos López", rating: 5, comment: "El hotel más hermoso que hemos visitado en Guatemala. La habitación suite superó nuestras expectativas.", date: "Febrero 2026" },
  { name: "Ana Martínez", rating: 5, comment: "Personal muy amable, instalaciones limpias y la comida del restaurante es deliciosa. Regresaremos pronto.", date: "Marzo 2026" },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        onClick={() => setOpen(!open)}
        data-testid={`faq-${q.slice(0, 20)}`}
      >
        <span className="font-medium text-foreground">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-primary shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <p className="pb-5 text-muted-foreground leading-relaxed text-sm">{a}</p>
      )}
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState({ fechaEntrada: "", fechaSalida: "", capacidad: "" });
  const { data: rooms, isLoading } = useListRooms({}, { query: { queryKey: ['rooms', 'featured'] } });
  const featured = rooms?.filter(r => r.activo).slice(0, 3) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.fechaEntrada) params.set("fechaEntrada", search.fechaEntrada);
    if (search.fechaSalida) params.set("fechaSalida", search.fechaSalida);
    if (search.capacidad) params.set("capacidad", search.capacidad);
    setLocation(`/rooms?${params.toString()}`);
  };

  const getRoomTypeLabel = (tipo: string) => {
    const types: Record<string, string> = { sencilla: "Sencilla", doble: "Doble", suite: "Suite", cabana: "Cabaña" };
    return types[tipo] || tipo;
  };

  return (
    <div className="flex flex-col w-full">

      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-end overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop"
          alt="Vista aérea del Hotel Los Volcanes"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 w-full container mx-auto px-4 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/90 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 mb-6">
              <Mountain className="h-3 w-3" />
              Antigua Guatemala, Guatemala
            </div>
            <h1 className="font-serif text-5xl md:text-7xl text-white font-bold leading-tight mb-6">
              Descubra la magia de<br/>Los Volcanes
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 font-light max-w-xl">
              Un refugio boutique inmerso en la naturaleza guatemalteca. Donde la elegancia, el confort y la calidez se encuentran.
            </p>
            {/* QUICK SEARCH */}
            <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Llegada</Label>
                <Input
                  type="date"
                  value={search.fechaEntrada}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setSearch(s => ({ ...s, fechaEntrada: e.target.value }))}
                  className="bg-white/90 border-0 rounded-none text-foreground"
                  data-testid="input-check-in"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Salida</Label>
                <Input
                  type="date"
                  value={search.fechaSalida}
                  min={search.fechaEntrada || new Date().toISOString().split("T")[0]}
                  onChange={e => setSearch(s => ({ ...s, fechaSalida: e.target.value }))}
                  className="bg-white/90 border-0 rounded-none text-foreground"
                  data-testid="input-check-out"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-white/70 text-xs uppercase tracking-wider">Huespedes</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  placeholder="1"
                  value={search.capacidad}
                  onChange={e => setSearch(s => ({ ...s, capacidad: e.target.value }))}
                  className="bg-white/90 border-0 rounded-none text-foreground"
                  data-testid="input-guests"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white rounded-none px-8 h-10 uppercase tracking-wide text-sm font-semibold w-full sm:w-auto" data-testid="button-search">
                  Buscar
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: "6", label: "Tipos de habitaciones" },
            { n: "15+", label: "Anos de experiencia" },
            { n: "98%", label: "Clientes satisfechos" },
            { n: "24/7", label: "Servicio al cliente" },
          ].map(({ n, label }) => (
            <div key={label}>
              <div className="font-serif text-3xl font-bold text-primary">{n}</div>
              <div className="text-secondary-foreground/70 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED ROOMS */}
      <section className="py-20 bg-background" id="habitaciones">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-primary uppercase tracking-widest text-xs font-semibold mb-3">Hospedaje de Lujo</p>
            <h2 className="font-serif text-4xl text-foreground mb-4">Nuestras Habitaciones</h2>
            <p className="text-muted-foreground">Cada espacio fue concebido para ofrecerle confort excepcional, vistas impresionantes y servicios que harán de su estadía un recuerdo imborrable.</p>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map(room => (
                <Link key={room.id} href={`/rooms/${room.id}`} data-testid={`card-room-${room.id}`}>
                  <div className="group cursor-pointer border bg-card overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={room.imageUrl || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop"}
                        alt={room.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold uppercase tracking-wider px-3 py-1">
                        {getRoomTypeLabel(room.tipo)}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-serif text-xl font-semibold mb-1 text-foreground">{room.nombre}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{room.descripcion}</p>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="font-bold text-xl text-primary">Q{room.precioNoche}</span>
                          <span className="text-muted-foreground text-xs ml-1">/ noche</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Hasta {room.capacidad} personas</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <Link href="/rooms">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white rounded-none uppercase tracking-wide px-10" data-testid="button-see-all-rooms">
                Ver Todas Las Habitaciones
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20 bg-muted" id="servicios">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-primary uppercase tracking-widest text-xs font-semibold mb-3">Todo Incluido</p>
            <h2 className="font-serif text-4xl text-foreground mb-4">Lo que ofrecemos</h2>
            <p className="text-muted-foreground">Cada servicio ha sido pensado para que su estadía sea perfecta desde el primer momento hasta el ultimo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card p-6 border hover:border-primary transition-colors group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                  <Icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="py-20 bg-background" id="galeria">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-primary uppercase tracking-widest text-xs font-semibold mb-3">Visual del Hotel</p>
            <h2 className="font-serif text-4xl text-foreground mb-4">Galeria</h2>
            <p className="text-muted-foreground">Explore nuestras instalaciones, habitaciones y el entorno natural que nos rodea.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {GALLERY.map((url, i) => (
              <div key={i} className="overflow-hidden aspect-video bg-muted">
                <img
                  src={url}
                  alt={`Galeria Hotel ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  data-testid={`gallery-image-${i}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-primary uppercase tracking-widest text-xs font-semibold mb-3">Lo que dicen nuestros huespedes</p>
            <h2 className="font-serif text-4xl mb-4">Opiniones</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {REVIEWS.map(({ name, rating, comment, date }) => (
              <div key={name} className="bg-secondary-foreground/5 border border-secondary-foreground/10 p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-secondary-foreground/80 text-sm leading-relaxed mb-4 italic">"{comment}"</p>
                <div className="border-t border-secondary-foreground/10 pt-3 flex justify-between items-center">
                  <span className="font-semibold text-sm">{name}</span>
                  <span className="text-secondary-foreground/50 text-xs">{date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW TO RESERVE */}
      <section className="py-20 bg-background" id="como-reservar">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-primary uppercase tracking-widest text-xs font-semibold mb-3">Sencillo y rapido</p>
            <h2 className="font-serif text-4xl text-foreground mb-4">Como Hacer Su Reservacion</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { n: "01", title: "Cree su cuenta", desc: "Registrese gratis en menos de 2 minutos para acceder a tarifas exclusivas." },
              { n: "02", title: "Elija su habitacion", desc: "Explore nuestra seleccion de habitaciones y aplique filtros de fechas y huespedes." },
              { n: "03", title: "Reserve en linea", desc: "Seleccione sus fechas, confirme las notas y haga clic en Reservar." },
              { n: "04", title: "Confirmacion inmediata", desc: "Reciba confirmacion instantanea y gestione su reserva desde su perfil." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="font-serif font-bold text-primary text-lg">{n}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/rooms">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-none px-10 uppercase tracking-wide" data-testid="button-start-reservation">
                Iniciar Reservacion
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted" id="faq">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14">
            <p className="text-primary uppercase tracking-widest text-xs font-semibold mb-3">Preguntas Frecuentes</p>
            <h2 className="font-serif text-4xl text-foreground mb-4">Resolvemos sus dudas</h2>
          </div>
          <div className="bg-card border divide-y divide-border px-6">
            {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* POLICIES SUMMARY */}
      <section className="py-20 bg-background" id="politicas">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-primary uppercase tracking-widest text-xs font-semibold mb-3">Transparencia Total</p>
            <h2 className="font-serif text-4xl text-foreground mb-4">Politicas del Hotel</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Cancelaciones",
                items: [
                  "Cancelacion gratuita con 48+ horas de anticipacion",
                  "Cargo de 1 noche si cancela dentro de las 48h",
                  "Sin reembolso en cancelacion el mismo dia",
                  "Modificaciones sujetas a disponibilidad",
                ]
              },
              {
                title: "Check-in / Check-out",
                items: [
                  "Check-in: 3:00 PM (flexible con solicitud)",
                  "Check-out: 12:00 PM",
                  "Early check-in disponible por Q150 adicional",
                  "Late check-out hasta las 3 PM por Q200",
                ]
              },
              {
                title: "Normas de la Casa",
                items: [
                  "No se permite fumar en interiores",
                  "Mascotas bienvenidas (hasta 10 kg, Q150/noche)",
                  "Silencio despues de las 11:00 PM",
                  "Menores de edad bajo responsabilidad de padres",
                ]
              },
            ].map(({ title, items }) => (
              <div key={title} className="bg-card border p-6">
                <h3 className="font-serif text-xl font-semibold mb-4 text-foreground">{title}</h3>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <Trees className="absolute right-12 top-8 h-48 w-48 text-white/5" />
        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">Su escapada perfecta comienza aqui</h2>
          <p className="text-white/80 text-xl mb-10 font-light">Registrese y reserve su habitacion ideal en Hotel Los Volcanes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-none uppercase tracking-wide px-10 font-semibold" data-testid="button-register-cta">
                Crear Cuenta Gratis
              </Button>
            </Link>
            <Link href="/rooms">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-none uppercase tracking-wide px-10" data-testid="button-rooms-cta">
                Ver Habitaciones
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-16 bg-secondary text-secondary-foreground" id="contacto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold mb-1">Ubicacion</p>
                <p className="text-secondary-foreground/70 text-sm">Calle del Arco 15, Antigua Guatemala, Sacatepequez, Guatemala</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold mb-1">Telefono</p>
                <p className="text-secondary-foreground/70 text-sm">+502 7832 4567</p>
                <p className="text-secondary-foreground/70 text-sm">+502 5555 0001 (WhatsApp)</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold mb-1">Email</p>
                <p className="text-secondary-foreground/70 text-sm">reservas@hotellosvolcanes.com</p>
                <p className="text-secondary-foreground/70 text-sm">info@hotellosvolcanes.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
