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
    if (seconds == null || isNaN(seconds)) return "-";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.round((seconds - Math.floor(seconds)) * 1000);

    const mm = String(mins).padStart(2, "0");
    const ss = String(secs).padStart(2, "0");
    const mmm = String(millis).padStart(3, "0");

    return `${mm}:${ss}.${mmm}`;
  };

  const getSwimmerName = (swimmerId) => {
    const swimmer = swimmers.find((s) => s.id === swimmerId);
    return swimmer ? swimmer.name : "Desconocido";
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortIndicator = (field) => {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const sortedTimes = [...times].sort((a, b) => {
    let valueA;
    let valueB;

    switch (sortField) {
      case "swimmer":
        valueA = getSwimmerName(a.swimmer_id).toLowerCase();
        valueB = getSwimmerName(b.swimmer_id).toLowerCase();
        break;
      case "distance":
        valueA = a.distance;
        valueB = b.distance;
        break;
      case "style":
        valueA = a.style?.toLowerCase() || "";
        valueB = b.style?.toLowerCase() || "";
        break;
      case "time_seconds":
        valueA = a.time_seconds ?? 0;
        valueB = b.time_seconds ?? 0;
        break;
      case "pace_100m":
        // Por si hay datos antiguos sin pace_100m en BD
        valueA = a.pace_100m ?? (a.time_seconds && a.distance ? a.time_seconds / (a.distance / 100) : 0);
        valueB = b.pace_100m ?? (b.time_seconds && b.distance ? b.time_seconds / (b.distance / 100) : 0);
        break;
      case "date":
        valueA = new Date(a.date).getTime();
        valueB = new Date(b.date).getTime();
        break;
      case "competition":
        valueA = (a.competition || "").toLowerCase();
        valueB = (b.competition || "").toLowerCase();
        break;
      default:
        valueA = 0;
        valueB = 0;
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (times.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500" data-testid="no-times-message">
        <p className="text-lg">No hay tiempos registrados aún</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {swimmers.length > 0 && (
              <TableHead
                className="font-semibold cursor-pointer select-none"
                onClick={() => handleSort("swimmer")}
              >
                Nadador {sortIndicator("swimmer")}
              </TableHead>
            )}
            <TableHead
              className="font-semibold cursor-pointer select-none"
              onClick={() => handleSort("distance")}
            >
              Distancia {sortIndicator("distance")}
            </TableHead>
            <TableHead
              className="font-semibold cursor-pointer select-none"
              onClick={() => handleSort("style")}
            >
              Estilo {sortIndicator("style")}
            </TableHead>
            <TableHead
              className="font-semibold cursor-pointer select-none"
              onClick={() => handleSort("time_seconds")}
            >
              Tiempo {sortIndicator("time_seconds")}
            </TableHead>
            <TableHead
              className="font-semibold cursor-pointer select-none"
              onClick={() => handleSort("pace_100m")}
            >
              Ritmo /100m {sortIndicator("pace_100m")}
            </TableHead>
            <TableHead
              className="font-semibold cursor-pointer select-none"
              onClick={() => handleSort("date")}
            >
              Fecha {sortIndicator("date")}
            </TableHead>
            <TableHead
              className="font-semibold cursor-pointer select-none"
              onClick={() => handleSort("competition")}
            >
              Competición {sortIndicator("competition")}
            </TableHead>
            {showActions && <TableHead className="font-semibold text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedTimes.map((time) => {
            const pace100 =
              time.pace_100m ??
              (time.time_seconds && time.distance
                ? time.time_seconds / (time.distance / 100)
                : null);

            return (
		 <TableRow
                   key={time.id}
                   className={`hover:bg-gray-50 ${
                     time.minima === "si" ? "bg-red-100" : ""
                   }`}
                   data-testid={`time-row-${time.id}`}
                 >

                {swimmers.length > 0 && (
                  <TableCell className="font-medium">
                    {getSwimmerName(time.swimmer_id)}
                  </TableCell>
                )}

                <TableCell>{time.distance}m</TableCell>

                <TableCell>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#278D33]/10 text-[#278D33]">
                    {time.style}
                  </span>
                </TableCell>

                <TableCell className="font-mono font-bold text-[#278D33]">
                  {formatTime(time.time_seconds)}
                </TableCell>

                <TableCell className="font-mono text-blue-600">
                  {pace100 != null ? formatTime(pace100) : "-"}
                </TableCell>

                <TableCell>
                  {format(new Date(time.date), "dd MMM yyyy", { locale: es })}
                </TableCell>

                <TableCell className="text-gray-600">
                  {time.competition || "-"}
                </TableCell>

                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(time)}
                        className="text-[#278D33] hover:text-[#1f6b28] hover:bg-[#278D33]/10"
                        data-testid={`edit-time-${time.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(time.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-time-${time.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

