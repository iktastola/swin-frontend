import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditUserDialog({ open, onOpenChange, onSubmit, user }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'swimmer',
    birth_date: '',
    gender:'fem'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        birth_date: user.birth_date ? new Date(user.birth_date).toISOString().slice(0, 16) : '',
        gender: user.gender ? user.gender : 'fem'
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Asegurarse de que se asigna la fecha actual si no se ha cambiado birth_date
    if (!formData.birth_date) {
      formData.birth_date = new Date().toISOString().slice(0, 16);
    }
    if (!formData.gender) {
      formData.gender = 'fem';
    }
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="edit-user-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#278D33]">Editar Usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              data-testid="edit-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              data-testid="edit-email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de nacimiento</Label>
            <Input
              id="birth_date"
              type="datetime-local"
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
              <SelectTrigger data-testid="edit-gender-select">
                <SelectValue placeholder="Seleccionar genero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fem">Femenino</SelectItem>
                <SelectItem value="mas">Masculino</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
              <SelectTrigger data-testid="edit-role-select">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="swimmer">Nadador</SelectItem>
                <SelectItem value="coach">Entrenador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#278D33] hover:bg-[#1f6b28]" data-testid="submit-edit-user-button">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

