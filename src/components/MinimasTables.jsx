import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AlertCircle, Loader2, MapPin, Printer, Waves } from "lucide-react";
import { API_URL as API } from "@/lib/api";
import { cn, formatSeconds } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const COLLECTIONS = {
  BizkaiaMinimas: { label: "Mínimas Bizkaia" },
  EHMinimas: { label: "Mínimas Euskal Herria" },
};

const STYLES = ["Libre", "Espalda", "Braza", "Mariposa", "Estilos"];

const CATEGORY_ORDER = [
  "alevin_1",
  "alevin_2",
  "infantil_1",
  "infantil_2",
  "junior_1",
  "junior_2",
  "junior_3",
  "abs_jov_1",
  "abs_jov_2",
  "abs_jov",
  "abs_1",
  "abs",
  "record",
];

const CATEGORY_LABELS = {
  alevin_1: "Alevín 1",
  alevin_2: "Alevín 2",
  infantil_1: "Infantil 1",
  infantil_2: "Infantil 2",
  junior_1: "Junior 1",
  junior_2: "Junior 2",
  junior_3: "Junior 3",
  abs_jov_1: "Abs. Joven 1",
  abs_jov_2: "Abs. Joven 2",
  abs_jov: "Abs. Joven",
  abs_1: "Abs. 1",
  abs: "Absoluto",
  record: "Récord",
};

const GENDERS = {
  fem: "Femenino",
  mas: "Masculino",
};

function categorySuffix(categoryKey) {
  return categoryKey?.replace(/^(fem|mas)_/, "") || null;
}

function categoryLabel(categoryKey) {
  const suffix = categorySuffix(categoryKey);
  if (!suffix) return null;
  return CATEGORY_LABELS[suffix] || suffix;
}

function categoryRank(categoryKey) {
  const suffix = categorySuffix(categoryKey);
  const rank = CATEGORY_ORDER.indexOf(suffix);
  return rank === -1 ? CATEGORY_ORDER.length : rank;
}

function parseFormattedTime(value) {
  const match = String(value).trim().match(/^(\d+):(\d{1,2})[.,](\d{1,3})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]) + Number(`0.${match[3]}`);
}

function toSeconds(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  return parseFormattedTime(value);
}

function flattenTimes(doc) {
  const result = {};
  const entries = Array.isArray(doc?.tiempos)
    ? doc.tiempos
    : Object.entries(doc?.tiempos || {}).map(([key, value]) => ({ [key]: value }));

  entries.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;

    const entrySeconds = toSeconds(entry.time_seconds);

    Object.entries(entry).forEach(([category, value]) => {
      if (category === "time_seconds") return;

      let seconds = null;

      if (value && typeof value === "object" && value.time_seconds !== undefined) {
        seconds = toSeconds(value.time_seconds);
      } else if (value !== null && value !== undefined) {
        seconds = toSeconds(value);
      }

      if (seconds === null) seconds = entrySeconds;
      if (seconds !== null) result[category] = seconds;
    });
  });

  return result;
}

function distanceLabel(doc) {
  const raw = doc?.distancia;
  if (raw === null || raw === undefined || raw === "") return "—";
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? `${numeric} m` : String(raw);
}

function distanceSortKey(doc) {
  const raw = String(doc?.distancia ?? "");
  const relay = raw.match(/^(\d+)\s*[xX]\s*(\d+)$/);
  if (relay) return 100000 + Number(relay[1]) * Number(relay[2]);

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 99999;
}

function MinimasTable({ rows, gender, highlightKey }) {
  const tableRows = rows.map((row) => ({ row, times: flattenTimes(row) }));
  const categoryKeys = [];

  tableRows.forEach(({ times }) => {
    Object.keys(times).forEach((key) => {
      if (key.startsWith(`${gender}_`) && !categoryKeys.includes(key)) {
        categoryKeys.push(key);
      }
    });
  });

  categoryKeys.sort((a, b) => categoryRank(a) - categoryRank(b));

  if (!rows.length || !categoryKeys.length) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        No hay mínimas disponibles con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-white">Distancia</TableHead>
            {categoryKeys.map((key) => {
              const highlighted = key === highlightKey;
              return (
                <TableHead
                  key={key}
                  className={cn(
                    "whitespace-nowrap text-center",
                    highlighted && "bg-emerald-50 font-bold text-[#278D33]"
                  )}
                >
                  {categoryLabel(key)}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableRows.map(({ row, times }, index) => (
            <TableRow key={`${row.prueba}-${row.distancia}-${index}`}>
              <TableCell className="sticky left-0 z-10 bg-white font-semibold">
                {distanceLabel(row)}
              </TableCell>
              {categoryKeys.map((key) => {
                const highlighted = key === highlightKey;
                return (
                  <TableCell
                    key={key}
                    className={cn(
                      "whitespace-nowrap text-center tabular-nums",
                      highlighted && "bg-emerald-50 font-semibold text-[#278D33]"
                    )}
                  >
                    {formatSeconds(times[key])}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function MinimasTables({ swimmerId }) {
  const [collection, setCollection] = useState(null);
  const [gender, setGender] = useState("fem");
  const [style, setStyle] = useState("Libre");
  const [pool, setPool] = useState("25");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["minimas", collection, pool, swimmerId || null],
    queryFn: async () => {
      const params = { piscina_metros: Number(pool) };
      if (swimmerId) params.swimmer_id = swimmerId;
      const response = await axios.get(`${API}/minimas/${collection}`, { params });
      return response.data;
    },
    enabled: Boolean(collection),
    staleTime: 60_000,
  });

  const documentos = useMemo(() => {
    const docs = data?.documentos || [];
    const byTest = new Map();

    docs.forEach((doc) => {
      const key = `${doc.prueba}|${doc.distancia}|${doc.piscina_metros ?? ""}`;
      if (!byTest.has(key)) byTest.set(key, doc);
    });

    return Array.from(byTest.values());
  }, [data]);

  const rows = useMemo(
    () =>
      documentos
        .filter((doc) => doc.prueba === style)
        .sort((a, b) => distanceSortKey(a) - distanceSortKey(b)),
    [documentos, style]
  );

  const highlightKey = data?.categoria || null;
  const highlightedGender = highlightKey?.startsWith("mas_")
    ? "mas"
    : highlightKey?.startsWith("fem_")
      ? "fem"
      : null;
  const activeHighlight = highlightKey?.startsWith(`${gender}_`) ? highlightKey : null;

  useEffect(() => {
    if (!collection) return;
    setGender("fem");
    setStyle("Libre");
    setPool("25");
  }, [collection]);

  useEffect(() => {
    if (highlightedGender) setGender(highlightedGender);
  }, [highlightedGender]);

  useEffect(() => {
    if (!documentos.length) return;
    if (!documentos.some((doc) => doc.prueba === style)) {
      setStyle(documentos[0].prueba);
    }
  }, [documentos, style]);

  const handlePrint = () => {
    if (!rows.length) return;
    window.print();
  };

  const collectionInfo = collection ? COLLECTIONS[collection] : null;
  const categoryName = categoryLabel(activeHighlight);
  const generatedAt = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="border-[#278D33] text-[#278D33] hover:bg-[#278D33] hover:text-white"
          onClick={() => setCollection("BizkaiaMinimas")}
        >
          <MapPin className="w-4 h-4" />
          Mínimas Bizkaia
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-[#278D33] text-[#278D33] hover:bg-[#278D33] hover:text-white"
          onClick={() => setCollection("EHMinimas")}
        >
          <Waves className="w-4 h-4" />
          Mínimas Euskal Herria
        </Button>
      </div>

      <Dialog open={Boolean(collection)} onOpenChange={(open) => !open && setCollection(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              {collectionInfo?.label}
            </DialogTitle>
            <DialogDescription>
              Consulta las marcas mínimas por categoría.
              {categoryName && (
                <span className="ml-1 font-semibold text-[#278D33]">
                  Categoría resaltada: {categoryName} ({GENDERS[gender]}).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-1">
              {Object.entries(GENDERS).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGender(value)}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                    gender === value
                      ? "bg-[#278D33] text-white shadow-sm"
                      : "text-gray-600 hover:text-[#278D33]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="w-[150px] bg-white">
                  <SelectValue placeholder="Prueba" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={pool} onValueChange={setPool}>
                <SelectTrigger className="w-[130px] bg-white">
                  <SelectValue placeholder="Piscina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 m</SelectItem>
                  <SelectItem value="50">50 m</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={handlePrint}
                disabled={!rows.length}
                className="bg-[#278D33] text-white hover:bg-[#1f6b28]"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </Button>
            </div>
          </div>

          {isPending ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando mínimas...
            </div>
          ) : isError ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {error?.response?.data?.detail || "No se pudieron cargar las mínimas."}
              </span>
            </div>
          ) : (
            <MinimasTable rows={rows} gender={gender} highlightKey={activeHighlight} />
          )}
        </DialogContent>
      </Dialog>

      {collection && data && (
        <div id="minimas-print-area">
          <h1>{collectionInfo?.label}</h1>
          <p className="minimas-print-subtitle">
            {GENDERS[gender]} · {style} · Piscina {pool} m
          </p>
          {categoryName && (
            <p className="minimas-print-subtitle">
              Categoría resaltada: {categoryName} ({GENDERS[gender]})
            </p>
          )}
          <MinimasTable rows={rows} gender={gender} highlightKey={activeHighlight} />
          <p className="minimas-print-footer">Generado el {generatedAt}</p>
        </div>
      )}
    </>
  );
}
