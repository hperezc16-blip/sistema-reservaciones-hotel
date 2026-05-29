import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Link } from "wouter";
import { useToast } from "../hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useLogin(
    {
      mutation: {
        onSuccess: (data) => {
          login(data.token, data.user);
          toast({
            title: "Inicio de sesión exitoso",
            description: `Bienvenido de nuevo, ${data.user.nombre}`,
          });
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Error al iniciar sesión",
            description: error.response?.data?.message || error.message || "Verifique sus credenciales",
          });
        },
      },
    },
  );

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data });
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 bg-muted/30">
      <div className="max-w-md w-full bg-card border p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Iniciar Sesión</h1>
          <p className="text-muted-foreground">Bienvenido de nuevo a Hotel Los Volcanes</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              {...form.register("password")}
              className={form.formState.errors.password ? "border-destructive" : ""}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-none uppercase tracking-wide"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Iniciando..." : "Ingresar"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          ¿No tiene una cuenta?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Regístrese aquí
          </Link>
        </div>

        <div className="mt-8 bg-muted/50 p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-2 text-foreground">Credenciales de demo:</p>
          <ul className="space-y-1">
            <li>Admin: admin@hotel.com / Admin123!</li>
            <li>Cliente: maria@example.com / Admin123!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
