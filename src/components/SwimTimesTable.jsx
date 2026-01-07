import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function SwimTimesTable({ times, swimmers = [], onDelete, onEdit, showActions = false }) {
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  };

  const getSwimmerName = (id) => swimmers.find((s) => s.id === id)?.name || "Desconocido";

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortIndicator = (field) => sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : "↕";

  const sortedTimes = [...times].sort((a, b) => {
    const A = a[sortField];
    const B = b[sortField];
    if (A < B) return sortDirection === "asc" ? -1 : 1;
    if (A > B) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (times.length === 0) {
    return <div className="text-center py-12 text-gray-500">No hay tiempos registrados aún</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">

            {swimmers.length > 0 && (
              <TableHead onClick={() => handleSort("swimmer")} className="cursor-pointer">
                Nadador {sortIndicator("swimmer")}
              </TableHead>
            )}

            <TableHead onClick={() => handleSort("distance")} className="cursor-pointer">
              Distancia {sortIndicator("distance")}
            </TableHead>

            <TableHead onClick={() => handleSort("style")} className="cursor-pointer">
              Estilo {sortIndicator("style")}
            </TableHead>

            <TableHead onClick={() => handleSort("time_seconds")} className="cursor-pointer">
              Tiempo {sortIndicator("time_seconds")}
            </TableHead>

            <TableHead onClick={() => handleSort("pace_100m")} className="cursor-pointer">
              Ritmo /100m {sortIndicator("pace_100m")}
            </TableHead>

            <TableHead onClick={() => handleSort("date")} className="cursor-pointer">
              Fecha {sortIndicator("date")}
            </TableHead>

            <TableHead onClick={() => handleSort("competition")} className="cursor-pointer">
              Competición {sortIndicator("competition")}
            </TableHead>

            <TableHead onClick={() => handleSort("oficial")} className="cursor-pointer">
              Oficial {sortIndicator("oficial")}
            </TableHead>

            {showActions && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedTimes.map((time) => (
            <TableRow
              key={time.id}
              className={`
                hover:bg-gray-50
                ${time.oficial === false
                  ? "bg-gradient-to-r from-gray-200 to-gray-100 opacity-70"
                  : ""
                }
                ${time.minima === "si" ? "bg-red-100" : time.minima_bizkaia === "si" ? "bg-green-100" : ""}
              `}
            >

              {swimmers.length > 0 && (
                <TableCell className="font-medium">{getSwimmerName(time.swimmer_id)}</TableCell>
              )}

              <TableCell>{time.distance}m</TableCell>
              <TableCell>
                <span className="px-3 py-1 rounded-full text-sm bg-[#278D33]/10 text-[#278D33]">
                  {time.style}
                </span>
              </TableCell>

              <TableCell className="font-mono font-bold text-[#278D33]">
                {formatTime(time.time_seconds)}
              </TableCell>

              <TableCell className="font-mono text-blue-600">
                {formatTime(time.pace_100m)}
              </TableCell>

              <TableCell>
                {format(new Date(time.date), "dd MMM yyyy", { locale: es })}
              </TableCell>

              <TableCell>{time.competition || "-"}</TableCell>

              <TableCell>
                {time.oficial ? (
                  <span className="text-green-600 font-bold">SI</span>
                ) : (
                  <span className="text-red-600 font-bold">NO</span>
                )}
              </TableCell>

              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(time)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(time.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              )}

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

