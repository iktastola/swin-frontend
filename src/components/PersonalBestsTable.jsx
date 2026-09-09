import { useMemo, useCallback, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import SwimtimesChartDialog from "@/components/SwimtimesChartDialog";

export default function PersonalBestsTable({ personalBests, allTimes = [], swimmerId, swimmerName }) {
  const [chartEvent, setChartEvent] = useState(null);
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : `${secs}s`;
  }, []);

  const groupedByStyle = useMemo(() => {
    return personalBests.reduce((acc, pb) => {
      if (!acc[pb.style]) acc[pb.style] = [];
      acc[pb.style].push(pb);
      return acc;
    }, {});
  }, [personalBests]);

  if (personalBests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500" data-testid="no-personal-bests-message">
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">No hay mejores marcas registradas aún</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedByStyle).map(([style, bests]) => (
          <div key={style} className="border rounded-lg p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h3 className="text-xl font-bold text-[#278D33] mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {style}
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Distancia</TableHead>
                    <TableHead className="font-semibold">Mejor Tiempo</TableHead>
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Competición</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bests.map((pb) => (
                    <TableRow key={`${pb.distance}-${pb.style}`} data-testid={`pb-row-${pb.distance}-${pb.style}`}>
                      <TableCell className="font-medium">{pb.distance}m</TableCell>
                      <TableCell className="font-mono font-bold text-[#278D33] text-lg">
                        {formatTime(pb.best_time)}
                      </TableCell>
                      <TableCell>{format(new Date(pb.date), 'dd MMM yyyy', { locale: es })}</TableCell>
                      <TableCell className="text-gray-600">{pb.competition || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-blue-600"
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
