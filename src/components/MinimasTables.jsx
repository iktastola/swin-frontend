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
  BizkaiaMinimas: { label: "Mínimas Bizkaia", short: "Bizkaia" },
  EHMinimas: { label: "Mínimas Euskal Herria", short: "Euskal Herria" },
};

const STYLES = ["Libre", "Espalda", "Braza", "Mariposa", "Estilos"];

const CATEGORIES = [
  { key: "alevin_1", label: "Alevín 1" },
  { key: "alevin_2", label: "Alevín 2" },
  { key: "infantil_1", label: "Infantil 1" },
  { key: "infantil_2", label: "Infantil 2" },
  { key: "junior_1", label: "Junior 1" },
  { key: "junior_2", label: "Junior 2" },
  { key: "junior_3", label: "Junior 3" },
  { key: "abs_jov", label: "Abs. Joven" },
  { key: "abs_1", label: "Abs. 1" },
];

const GENDERS = {
  fem: "Femenino",
  masc: "Masculino",
};

function categoryLabel(categoryKey) {
  if (!categoryKey) return null;
  const category = CATEGORIES.find((item) => categoryKey.endsWith(`_${item.key}`));
  return category?.label || null;
}

function flattenTimes(doc) {
  const result = {};
  const entries = Array.isArray(doc?.tiempos)
    ? doc.tiempos
    : Object.entries(doc?.tiempos || {}).map(([key, value]) => ({ [key]: value }));

  entries.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    Object.entries(entry).forEach(([category, value]) => {
      if (value && typeof value === "object" && value.time_seconds !== undefined) {
        result[category] = value.time_seconds;
      } else if (typeof value === "number") {
        result[category] = value;
      }
    });
  });

  return result;
}

function distanceNumber(doc) {
  const value = Number(doc?.distancia);
  return Number.isFinite(value) ? value : 0;
}

function MinimasTable({ rows, gender, highlightKey }) {
  if (!rows.length) {
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
            {CATEGORIES.map((category) => {
              const key = `${gender}_${category.key}`;
              const highlighted = key === highlightKey;
              return (
                <TableHead
                  key={category.key}
                  className={cn(
                    "whitespace-nowrap text-center",
                    highlighted && "bg-emerald-50 font-bold text-[#278D33]"
                  )}
                >
                  {category.label}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const times = flattenTimes(row);
            return (
              <TableRow key={`${row.prueba}-${row.distancia}`}>
                <TableCell className="sticky left-0 z-10 bg-white font-semibold">
                  {distanceNumber(row)} m
                </TableCell>
                {CATEGORIES.map((category) => {
                  const key = `${gender}_${category.key}`;
                  const highlighted = key === highlightKey;
                  return (
                    <TableCell
                      key={category.key}
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
            );
          })}
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

  const isBizkaia = collection === "BizkaiaMinimas";

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["minimas", collection, isBizkaia ? pool : null, swimmerId || null],
    queryFn: async () => {
      const params = {};
      if (isBizkaia) params.piscina_metros = Number(pool);
      if (swimmerId) params.swimmer_id = swimmerId;
      const response = await axios.get(`${API}/minimas/${collection}`, { params });
      return response.data;
    },
    enabled: Boolean(collection),
    staleTime: 60_000,
  });

  const documentos = useMemo(() => {
    const docs = data?.documentos || [];
    if (collection !== "EHMinimas") return docs;

    const byTest = new Map();
    docs.forEach((doc) => {
      const key = `${doc.prueba}|${doc.distancia}`;
      const existing = byTest.get(key);
      if (!existing || (Number(doc.piscina_metros) === 25 && Number(existing.piscina_metros) !== 25)) {
        byTest.set(key, doc);
      }
    });
    return Array.from(byTest.values());
  }, [data, collection]);

  const rows = useMemo(
    () =>
      documentos
        .filter((doc) => doc.prueba === style)
        .sort((a, b) => distanceNumber(a) - distanceNumber(b)),
    [documentos, style]
  );

  const highlightKey = data?.categoria || null;
  const highlightedGender = highlightKey?.startsWith("masc_")
    ? "masc"
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

              {isBizkaia && (
                <Select value={pool} onValueChange={setPool}>
                  <SelectTrigger className="w-[130px] bg-white">
                    <SelectValue placeholder="Piscina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 m</SelectItem>
                    <SelectItem value="50">50 m</SelectItem>
                  </SelectContent>
                </Select>
              )}

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
            {GENDERS[gender]} · {style}
            {isBizkaia ? ` · Piscina ${pool} m` : ""}
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
