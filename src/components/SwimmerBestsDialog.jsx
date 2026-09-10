import { useMemo, useCallback, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import SwimtimesChartDialog from "@/components/SwimtimesChartDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SwimmerBestsDialog({ open, onOpenChange, swimmerId, swimmerName, allTimes = [] }) {
  const [chartEvent, setChartEvent] = useState(null);

  const formatTime = useCallback((seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`;
  }, []);

  const personalBests = useMemo(() => {
    const bestsMap = new Map();
    allTimes
      .filter((t) => t.swimmer_id === swimmerId)
      .forEach((t) => {
        const key = `${t.distance}-${t.style}`;
        if (!bestsMap.has(key) || t.time_seconds < bestsMap.get(key).time_seconds) {
          bestsMap.set(key, {
            distance: t.distance,
            style: t.style,
            best_time: t.time_seconds,
            date: t.date,
            competition: t.competition,
          });
        }
      });
    return Array.from(bestsMap.values());
  }, [allTimes, swimmerId]);

  const groupedByStyle = useMemo(() => {
    return personalBests.reduce((acc, pb) => {
      if (!acc[pb.style]) acc[pb.style] = [];
      acc[pb.style].push(pb);
      return acc;
    }, {});
  }, [personalBests]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#278D33]" />
              Mejores Marcas - {swimmerName}
            </DialogTitle>
            <DialogDescription>
              Mejores tiempos por prueba de natación
            </DialogDescription>
          </DialogHeader>

          {personalBests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No hay mejores marcas registradas para este nadador</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByStyle).map(([style, bests]) => (
                <div key={style} className="border rounded-lg p-3 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <h3 className="text-lg font-bold text-[#278D33] mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    {style}
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold text-xs">Distancia</TableHead>
                          <TableHead className="font-semibold text-xs">Mejor Tiempo</TableHead>
                          <TableHead className="font-semibold text-xs">Fecha</TableHead>
                          <TableHead className="font-semibold text-xs">Competición</TableHead>
                          <TableHead className="font-semibold text-xs text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bests.map((pb) => (
                          <TableRow key={`${pb.distance}-${pb.style}`}>
                            <TableCell className="font-medium text-sm">{pb.distance}m</TableCell>
                            <TableCell className="font-mono font-bold text-[#278D33]">
                              {formatTime(pb.best_time)}
                            </TableCell>
                            <TableCell className="text-sm">{format(new Date(pb.date), 'dd MMM yyyy', { locale: es })}</TableCell>
                            <TableCell className="text-gray-600 text-sm">{pb.competition || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-blue-600"
                                title="Ver evolución"
                                onClick={() => setChartEvent({
                                  swimmer_id: swimmerId,
                                  distance: pb.distance,
                                  style: pb.style,
                                  piscina_metros: null,
                                })}
                              >
                                <LineChart className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {chartEvent && (
        <SwimtimesChartDialog
          open={!!chartEvent}
          onOpenChange={(o) => { if (!o) setChartEvent(null); }}
          times={allTimes}
          event={chartEvent}
          swimmerName={swimmerName}
        />
      )}
    </>
  );
}