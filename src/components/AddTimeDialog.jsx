import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DISTANCES = [50, 100, 200, 400, 800, 1500];
const STYLES = ["Libre", "Espalda", "Braza", "Mariposa", "Estilos"];

export default function AddTimeDialog({ open, onOpenChange, onSubmit, swimmers }) {
  const [formData, setFormData] = useState({
    swimmer_id: "",
    distance: "",
    style: "",
    minutes: "",
    seconds: "",
    milliseconds: "",
    date: new Date().toISOString().split("T")[0],
    competition: "",
    oficial: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const totalSeconds =
      (parseInt(formData.minutes) || 0) * 60 +
      (parseFloat(formData.seconds) || 0) +
      ((parseInt(formData.milliseconds) || 0) / 1000);

    const timeData = {
      swimmer_id: formData.swimmer_id,
      distance: parseInt(formData.distance),
      style: formData.style,
      time_seconds: totalSeconds,
      date: new Date(formData.date).toISOString(),
      competition: formData.competition || null,
      oficial: formData.oficial,
    };

    onSubmit(timeData);

    setFormData({
      swimmer_id: "",
      distance: "",
      style: "",
      minutes: "",
      seconds: "",
      milliseconds: "",
      date: new Date().toISOString().split("T")[0],
      competition: "",
      oficial: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#278D33]">Registrar Nuevo Tiempo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label>Nadador</Label>
            <Select
              value={formData.swimmer_id}
              onValueChange={(v) => setFormData({ ...formData, swimmer_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nadador" />
              </SelectTrigger>
              <SelectContent>
                {swimmers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Distancia</Label>
              <Select
                value={formData.distance}
                onValueChange={(v) => setFormData({ ...formData, distance: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Metros" />
                </SelectTrigger>
                <SelectContent>
                  {DISTANCES.map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {d}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estilo</Label>
              <Select
                value={formData.style}
                onValueChange={(v) => setFormData({ ...formData, style: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estilo" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tiempo</Label>
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                placeholder="Min"
                value={formData.minutes}
                onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Seg"
                value={formData.seconds}
                onChange={(e) => setFormData({ ...formData, seconds: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Ms"
                value={formData.milliseconds}
                onChange={(e) => setFormData({ ...formData, milliseconds: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Competición (opcional)</Label>
            <Input
              value={formData.competition}
              onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Oficial</Label>
            <Select
              value={formData.oficial ? "true" : "false"}
              onValueChange={(v) => setFormData({ ...formData, oficial: v === "true" })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">SI</SelectItem>
                <SelectItem value="false">NO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#278D33] hover:bg-[#1f6b28]">
              Registrar Tiempo
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}

