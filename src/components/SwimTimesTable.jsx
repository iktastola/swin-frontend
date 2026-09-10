import { useState, useRef, useMemo, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Download, Upload, LineChart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import SwimtimesChartDialog from "@/components/SwimtimesChartDialog";
import SwimmerBestsDialog from "@/components/SwimmerBestsDialog";

export default function SwimTimesTable({ times, swimmers = [], allTimes = [], onDelete, onEdit, onUpload, showActions = false }) {
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const fileInputRef = useRef(null);
  const [chartTime, setChartTime] = useState(null);
  const [bestsSwimmer, setBestsSwimmer] = useState(null);

  const formatTime = useCallback((seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  }, []);

  const swimmerNames = useMemo(
    () => new Map(swimmers.map((s) => [s.id, s.name])),
    [swimmers]
  );

  const swimmerAvatars = useMemo(
    () => new Map(swimmers.map((s) => [s.id, s.avatar_url])),
    [swimmers]
  );

  const getSwimmerName = useCallback(
    (id) => swimmerNames.get(id) || "Desconocido",
    [swimmerNames]
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortIndicator = (field) => sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : "↕";

  const sortedTimes = useMemo(() => {
    const aValFor = (t) => sortField === "swimmer" ? getSwimmerName(t.swimmer_id) : t[sortField];
    return [...times].sort((a, b) => {
      const aVal = aValFor(a);
      const bVal = aValFor(b);
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [times, sortField, sortDirection, getSwimmerName]);

  const handleDownloadCSV = () => {
    const headers = ["Fecha", "Nadador", "Distancia", "Piscina", "Estilo", "Tiempo", "Ritmo", "Competición", "Oficial"];
    const rows = sortedTimes.map(t => [
      format(new Date(t.date), "yyyy-MM-dd"),
      getSwimmerName(t.swimmer_id),
      `${t.distance}m`,
      `${t.piscina_metros ?? 25}m`,
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
              <TableHead className="w-8"></TableHead>
              {swimmers.length > 0 && (
                <TableHead onClick={() => handleSort("swimmer")} className="cursor-pointer">
                  Nadador {sortIndicator("swimmer")}
                </TableHead>
              )}
              <TableHead onClick={() => handleSort("distance")} className="cursor-pointer">
                Distancia {sortIndicator("distance")}
              </TableHead>
              <TableHead onClick={() => handleSort("piscina_metros")} className="cursor-pointer">
                Piscina {sortIndicator("piscina_metros")}
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
                <TableCell className="w-8">
                  {time.minima === "si" || time.minima_bizkaia === "si" ? (
                    <div className={`w-3 h-3 rounded-full ${
                      time.minima === "si" ? "bg-red-500" : "bg-green-500"
                    }`} />
                  ) : null}
                </TableCell>
                {swimmers.length > 0 && (
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Avatar
                        className="h-8 w-8 border border-gray-200 shrink-0 transition-transform duration-300 hover:scale-[2] hover:z-50 shadow-md cursor-pointer"
                        onClick={() => setBestsSwimmer({ id: time.swimmer_id, name: getSwimmerName(time.swimmer_id) })}
                        title="Ver mejores marcas"
                      >
                        <AvatarImage src={swimmerAvatars.get(time.swimmer_id)} />
                        <AvatarFallback className="bg-[#278D33]/10 text-[#278D33]">
                          {getSwimmerName(time.swimmer_id).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {getSwimmerName(time.swimmer_id)}
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-gray-600">{time.distance}m</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                    {time.piscina_metros ?? 25}m
                  </span>
                </TableCell>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => setChartTime(time)} title="Ver evolución">
                        <LineChart className="w-4 h-4" />
                      </Button>
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

      {chartTime && (
        <SwimtimesChartDialog
          open={!!chartTime}
          onOpenChange={(o) => { if (!o) setChartTime(null); }}
          times={times}
          event={{
            swimmer_id: chartTime.swimmer_id,
            distance: chartTime.distance,
            style: chartTime.style,
            piscina_metros: chartTime.piscina_metros ?? null,
          }}
          swimmerName={getSwimmerName(chartTime.swimmer_id)}
        />
      )}

      {bestsSwimmer && (
        <SwimmerBestsDialog
          open={!!bestsSwimmer}
          onOpenChange={(o) => { if (!o) setBestsSwimmer(null); }}
          swimmerId={bestsSwimmer.id}
          swimmerName={bestsSwimmer.name}
          allTimes={allTimes.length > 0 ? allTimes : times}
        />
      )}
    </div>
  );
}

