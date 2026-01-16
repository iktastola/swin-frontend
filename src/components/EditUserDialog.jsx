import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, User as UserIcon, Loader2 } from "lucide-react";
import axios from "axios";

export default function EditUserDialog({ open, onOpenChange, onSubmit, user }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'swimmer',
    birth_date: '',
    gender: 'fem',
    avatar_url: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        birth_date: user.birth_date ? new Date(user.birth_date).toISOString().slice(0, 16) : '',
        gender: user.gender ? user.gender : 'fem',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error("Cloudinary no está configurado en las variables de entorno.");
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        uploadData
      );
      setFormData(prev => ({ ...prev, avatar_url: res.data.secure_url }));
      toast.success("Imagen subida correctamente");
    } catch (err) {
      console.error("Error uploading to Cloudinary", err);
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

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
          <DialogDescription>
            Modifica los datos del usuario y su foto de perfil.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-[#278D33]/20 shadow-lg">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="bg-[#278D33]/10 text-[#278D33] text-2xl font-bold">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : <UserIcon className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="admin-avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              </label>
              <input
                id="admin-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-gray-500">Haz clic para cambiar la foto del usuario</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Género</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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
    </Dialog >
  );
}

