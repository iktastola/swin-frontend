import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, User as UserIcon, Loader2 } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function EditProfileDialog({ open, onOpenChange, user, onUserUpdated }) {
  const [formData, setFormData] = useState({
    birth_date: '',
    password: '',
    confirmPassword: '',
    avatar_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && open) {
      // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
      const dateVal = user.birth_date ? new Date(user.birth_date).toISOString().slice(0, 16) : '';
      setFormData({
        birth_date: dateVal,
        password: '',
        confirmPassword: '',
        avatar_url: user.avatar_url || ''
      });
      setError('');
    }
  }, [user, open]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // DEBUG: Verificar si las variables están llegando
    const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    console.log("Cloudinary Config Status:", {
      hasCloudName: !!CLOUD_NAME,
      hasPreset: !!UPLOAD_PRESET,
      cloudNameValue: CLOUD_NAME // Public anyway
    });

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error("Cloudinary no está configurado. Por favor, reinicia el servidor (npm start) para aplicar los cambios del archivo .env.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password) {
      if (formData.password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (!/\d/.test(formData.password)) {
        setError("La contraseña debe incluir al menos un número.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {};
      if (formData.birth_date) payload.birth_date = formData.birth_date;
      if (formData.password) payload.password = formData.password;
      if (formData.avatar_url) payload.avatar_url = formData.avatar_url;

      const response = await axios.patch(`${API}/users/me`, payload, { headers });

      toast.success("Perfil actualizado correctamente");
      if (onUserUpdated) {
        onUserUpdated(response.data);
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Error al actualizar perfil");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#278D33]">Editar Mi Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-[#278D33]/20 shadow-lg">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="bg-[#278D33]/10 text-[#278D33] text-2xl font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-10 w-10" />}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-gray-500">Haz clic para cambiar tu foto de perfil</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de nacimiento</Label>
            <Input
              id="birth_date"
              type="datetime-local"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Cambiar Contraseña (Opcional)</h4>
            <p className="text-xs text-gray-500 mb-4">
              Debe tener al menos 8 caracteres y contener un número.
            </p>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nueva contraseña"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </div>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#278D33] hover:bg-[#1f6b28]">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
