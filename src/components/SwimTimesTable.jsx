import { useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Download, Upload } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function SwimTimesTable({ times, swimmers = [], onDelete, onEdit, onUpload, showActions = false }) {
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const fileInputRef = useRef(null);

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

  const handleDownloadCSV = () => {
    const headers = ["Fecha", "Nadador", "Distancia", "Estilo", "Tiempo", "Ritmo", "Competición", "Oficial"];
    const rows = sortedTimes.map(t => [
      format(new Date(t.date), "yyyy-MM-dd"),
      getSwimmerName(t.swimmer_id),
      `${t.distance}m`,
      t.style,
      formatTime(t.time_seconds),
      formatTime(t.pace_100m),
      t.competition || "-",
      t.oficial ? "SI" : "NO"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tiempos_natacion_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (onUpload) {
          onUpload(json);
        }
      } catch (err) {
        console.error("Error parsing JSON:", err);
      }
      // Reset input
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  if (times.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50/30">
          No hay tiempos registrados aún
        </div>
        <div className="flex justify-end gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir JSON
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
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
                  hover:bg-gray-50/80 transition-colors
                  ${time.oficial === false
                    ? "bg-gray-50/50 opacity-70"
                    : ""
                  }
                  ${time.minima === "si" ? "bg-red-50/80" : time.minima_bizkaia === "si" ? "bg-green-50/80" : ""}
                `}
              >
                {swimmers.length > 0 && (
                  <TableCell className="font-medium text-gray-900">{getSwimmerName(time.swimmer_id)}</TableCell>
                )}
                <TableCell className="text-gray-600">{time.distance}m</TableCell>
                <TableCell>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#278D33]/10 text-[#278D33]">
                    {time.style}
                  </span>
                </TableCell>
                <TableCell className="font-mono font-bold text-[#278D33]">
                  {formatTime(time.time_seconds)}
                </TableCell>
                <TableCell className="font-mono text-blue-600/80 text-sm">
                  {formatTime(time.pace_100m)}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {format(new Date(time.date), "dd MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell className="text-gray-600 italic">
                  {time.competition || "-"}
                </TableCell>
                <TableCell>
                  {time.oficial ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">SI</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">NO</span>
                  )}
                </TableCell>

                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#278D33]" onClick={() => onEdit(time)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => onDelete(time.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
            onClick={handleDownloadCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir JSON
          </Button>
        </div>
      </div>
    </div>
  );
}

