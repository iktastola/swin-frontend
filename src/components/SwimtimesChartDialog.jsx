import { useMemo } from "react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingDown, Trophy } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
};

const pct = (delta, base) => {
  if (!base) return "0%";
  return `${(delta / base * 100).toFixed(2)}%`;
};

export default function SwimtimesChartDialog({ open, onOpenChange, times, event, swimmerName }) {
  const chartConfig = {
    time: { label: "Tiempo", color: "#278D33" },
  };

  // Datos de evolución: todos los tiempos oficiales del mismo evento,
  // ordenados por fecha ascendente.
  const series = useMemo(() => {
    if (!times || !event) return [];
    return times
      .filter((t) => {
        const sameEvent =
          t.swimmer_id === event.swimmer_id &&
          String(t.distance) === String(event.distance) &&
          t.style === event.style;
        const samePool = event.piscina_metros != null
          ? t.piscina_metros === event.piscina_metros
          : true;
        return sameEvent && samePool && t.oficial !== false;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((t, i) => ({
        order: i,
        date: new Date(t.date),
        time_seconds: t.time_seconds,
        timeLabel: formatTime(t.time_seconds),
      }));
  }, [times, event]);

  const summary = useMemo(() => {
    if (series.length === 0) return null;
    const first = series[0];
    const last = series[series.length - 1];
    let best = first;
    series.forEach((s) => {
      if (s.time_seconds < best.time_seconds) best = s;
    });

    const deltaFirstBest = best.time_seconds - first.time_seconds;
    const deltaFirstLast = last.time_seconds - first.time_seconds;

    return {
      first,
      last,
      best,
      deltaFirstBest,
      deltaFirstLast,
      pctFirstBest: pct(deltaFirstBest, first.time_seconds),
      pctFirstLast: pct(deltaFirstLast, first.time_seconds),
    };
  }, [series]);

  const domain = useMemo(() => {
    if (series.length === 0) return [0, 0];
    const values = series.map((s) => s.time_seconds);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.15, 0.5);
    return [Math.max(0, min - pad), max + pad];
  }, [series]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-900">
            Evolución de la marca
          </DialogTitle>
          <DialogDescription>
            {swimmerName || ""} — {event?.style} {event?.distance != null ? `${event.distance}m` : ""}
            {event?.piscina_metros != null ? ` · Piscina ${event.piscina_metros}m` : ""}
          </DialogDescription>
        </DialogHeader>

        {series.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No hay tiempos oficiales suficientes para este evento.
          </div>
        ) : (
          <div className="space-y-4">
            <ChartContainer
              config={chartConfig}
              className="h-[300px] w-full"
            >
              <LineChart
                data={series}
                margin={{ top: 10, right: 20, bottom: 10, left: 10 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(v, "dd MMM yy", { locale: es })}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                  tickMargin={8}
                />
                <YAxis
                  domain={domain}
                  tickFormatter={(v) => formatTime(v)}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const p = payload?.[0]?.payload;
                        return p ? format(p.date, "dd MMM yyyy", { locale: es }) : "";
                      }}
                      formatter={(value) => [formatTime(Number(value)), "Tiempo"]}
                      indicator="dot"
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="time_seconds"
                  stroke="#278D33"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#278D33", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>

            {summary && (
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#278D33]" />
                    Resumen
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {series.length} registro{series.length !== 1 ? "s" : ""} · desde {format(summary.first.date, "dd MMM yyyy", { locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase font-semibold">Primera</div>
                      <div className="text-lg font-mono font-bold text-gray-800">{summary.first.timeLabel}</div>
                      <div className="text-[11px] text-gray-400">{format(summary.first.date, "dd MMM yy", { locale: es })}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="text-xs text-emerald-600 uppercase font-semibold">Mejor marca</div>
                      <div className="text-lg font-mono font-bold text-[#278D33]">{summary.best.timeLabel}</div>
                      <div className="text-[11px] text-emerald-500">{format(summary.best.date, "dd MMM yy", { locale: es })}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 uppercase font-semibold">Última</div>
                      <div className="text-lg font-mono font-bold text-gray-800">{summary.last.timeLabel}</div>
                      <div className="text-[11px] text-gray-400">{format(summary.last.date, "dd MMM yy", { locale: es })}</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-[#278D33]/5 border border-[#278D33]/10 px-4 py-2.5">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <TrendingDown className={`w-4 h-4 ${summary.deltaFirstBest <= 0 ? "text-[#278D33]" : "text-red-500"}`} />
                        Mejora (primera → mejor)
                      </span>
                      <span className={`font-mono font-bold text-base ${summary.deltaFirstBest <= 0 ? "text-[#278D33]" : "text-red-500"}`}>
                        {summary.deltaFirstBest <= 0 ? "" : "+"}{formatTime(Math.abs(summary.deltaFirstBest))}
                        <span className="text-sm ml-2">({summary.pctFirstBest})</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-gray-500" />
                        Variación (primera → última)
                      </span>
                      <span className={`font-mono font-bold text-base ${summary.deltaFirstLast <= 0 ? "text-[#278D33]" : "text-red-500"}`}>
                        {summary.deltaFirstLast <= 0 ? "" : "+"}{formatTime(Math.abs(summary.deltaFirstLast))}
                        <span className="text-sm ml-2">({summary.pctFirstLast})</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
