import { useState } from "react";
import { 
  useListRooms, 
  useCreateRoom, 
  useUpdateRoom, 
  useDeleteRoom,
  getListRoomsQueryKey,
  type Room,
  type RoomInputTipo
} from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { useToast } from "../../hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "../../components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useForm, Controller } from "react-hook-form";

export default function Rooms() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useListRooms(
    {},
    { query: { queryKey: getListRoomsQueryKey({}) } }
  );

  const invalidateRooms = () => {
    queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey({}) });
    setIsDialogOpen(false);
    setEditingRoom(null);
    reset();
  };

  const createMutation = useCreateRoom({
    mutation: {
      onSuccess: () => {
        toast({ title: "Habitación creada" });
        invalidateRooms();
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    }
  });

  const updateMutation = useUpdateRoom({
    mutation: {
      onSuccess: () => {
        toast({ title: "Habitación actualizada" });
        invalidateRooms();
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    }
  });

  const deleteMutation = useDeleteRoom({
    mutation: {
      onSuccess: () => {
        toast({ title: "Habitación eliminada" });
        invalidateRooms();
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    }
  });

  const { register, handleSubmit, control, reset, formState: { errors }, setValue } = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
      tipo: "sencilla" as RoomInputTipo,
      precioNoche: "",
      capacidad: 1,
      imageUrl: "",
      amenidades: "",
      activo: true,
    }
  });

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    reset({
      nombre: room.nombre,
      descripcion: room.descripcion || "",
      tipo: room.tipo as RoomInputTipo,
      precioNoche: room.precioNoche,
      capacidad: room.capacidad,
      imageUrl: room.imageUrl || "",
      amenidades: room.amenidades || "",
      activo: room.activo,
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingRoom(null);
    reset({
      nombre: "",
      descripcion: "",
      tipo: "sencilla",
      precioNoche: "",
      capacidad: 1,
      imageUrl: "",
      amenidades: "",
      activo: true,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      capacidad: Number(data.capacidad),
      precioNoche: data.precioNoche.toString(),
    };

    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom.id, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Seguro que desea eliminar esta habitación?")) {
      deleteMutation.mutate({ id });
    }
  };

  const toggleStatus = (room: Room, activo: boolean) => {
    updateMutation.mutate({ 
      id: room.id, 
      data: {
        nombre: room.nombre,
        tipo: room.tipo as RoomInputTipo,
        precioNoche: room.precioNoche,
        capacidad: room.capacidad,
        activo: activo
      } 
    });
  };

  if (isLoading) return <div className="p-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Gestión de Habitaciones</h1>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground gap-2">
          <Plus className="h-4 w-4" /> Nueva Habitación
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editingRoom ? "Editar Habitación" : "Crear Nueva Habitación"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...register("nombre", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sencilla">Sencilla</SelectItem>
                        <SelectItem value="doble">Doble</SelectItem>
                        <SelectItem value="suite">Suite</SelectItem>
                        <SelectItem value="cabana">Cabaña</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio por Noche ($)</Label>
                <Input type="number" step="0.01" {...register("precioNoche", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Capacidad (personas)</Label>
                <Input type="number" {...register("capacidad", { required: true, min: 1 })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea {...register("descripcion")} />
            </div>

            <div className="space-y-2">
              <Label>URL de la Imagen</Label>
              <Input {...register("imageUrl")} placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label>Amenidades (separadas por coma)</Label>
              <Input {...register("amenidades")} placeholder="Wi-Fi, TV, Minibar" />
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label>Activo (Visible para clientes)</Label>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRoom ? "Guardar Cambios" : "Crear Habitación"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card border shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Habitación</th>
              <th className="px-6 py-4 font-medium">Tipo</th>
              <th className="px-6 py-4 font-medium">Precio</th>
              <th className="px-6 py-4 font-medium text-center">Capacidad</th>
              <th className="px-6 py-4 font-medium text-center">Estado</th>
              <th className="px-6 py-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rooms?.map((room) => (
              <tr key={room.id} className="hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{room.nombre}</div>
                </td>
                <td className="px-6 py-4 capitalize">{room.tipo}</td>
                <td className="px-6 py-4 font-medium">${room.precioNoche}</td>
                <td className="px-6 py-4 text-center">{room.capacidad}</td>
                <td className="px-6 py-4 text-center">
                  <Switch 
                    checked={room.activo} 
                    onCheckedChange={(checked) => toggleStatus(room, checked)}
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(room)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(room.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
