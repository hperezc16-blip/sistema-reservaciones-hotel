import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Link } from "wouter";
import { useToast } from "../hooks/use-toast";

const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  telefono: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      telefono: "",
    },
  });

  const registerMutation = useRegister(
    {
      mutation: {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast({
            title: "Registro exitoso",
            description: `Bienvenido a Hotel Los Volcanes, ${data.user.nombre}`,
          });
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Error al registrarse",
            description: error.response?.data?.message || error.message || "Intente nuevamente",
          });
        },
      },
    },
  );

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({ data });
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 bg-muted/30">
      <div className="max-w-md w-full bg-card border p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Crear Cuenta</h1>
          <p className="text-muted-foreground">Únase a Hotel Los Volcanes</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre Completo</Label>
            <Input
              id="nombre"
              placeholder="Juan Pérez"
              {...form.register("nombre")}
              className={form.formState.errors.nombre ? "border-destructive" : ""}
            />
            {form.formState.errors.nombre && (
              <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="su@email.com"
              {...form.register("email")}
              className={form.formState.errors.email ? "border-destructive" : ""}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              {...form.register("password")}
              className={form.formState.errors.password ? "border-destructive" : ""}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono (Opcional)</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="+502 1234 5678"
              {...form.register("telefono")}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-none uppercase tracking-wide"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Registrando..." : "Registrarse"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          ¿Ya tiene una cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Inicie sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
