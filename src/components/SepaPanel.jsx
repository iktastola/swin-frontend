import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_COLORS = {
  generated: "bg-blue-100 text-blue-800",
  partially_returned: "bg-amber-100 text-amber-800",
  closed: "bg-gray-200 text-gray-800",
  sent: "bg-green-100 text-green-800",
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

function firstOfCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function lastOfCurrentMonth() {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

export default function SepaPanel() {
  const [dateFrom, setDateFrom] = useState(firstOfCurrentMonth());
  const [dateTo, setDateTo] = useState(lastOfCurrentMonth());
  const [collectionDate, setCollectionDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await axios.get(`${API}/sepa/remesas`, { headers: authHeaders() });
      setHistory(data || []);
    } catch (e) {
      toast.error("Error cargando histórico de remesas");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Indica fecha inicio y fecha fin");
      return;
    }
    if (dateFrom > dateTo) {
      toast.error("La fecha inicio debe ser ≤ fecha fin");
      return;
    }

    setGenerating(true);
    setLastResult(null);
    try {
      const body = { date_from: dateFrom, date_to: dateTo };
      if (collectionDate) body.collection_date = collectionDate;

      const { data } = await axios.post(
        `${API}/sepa/remesas/generate`, body, { headers: authHeaders() },
      );
      setLastResult(data);
      toast.success(`Remesa generada: ${data.n_txs} cobros, ${data.total_amount.toFixed(2)} €`);
      fetchHistory();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      toast.error(`Error: ${msg}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (remesaId, messageId) => {
    try {
      const res = await axios.get(
        `${API}/sepa/remesas/${remesaId}/xml`,
        { headers: authHeaders(), responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/xml" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${messageId || remesaId}.xml`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Error descargando XML");
    }
  };

  return (
    <div className="space-y-6">

      {/* Generador */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" /> Generar remesa SEPA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="date-from">Fecha inicio</Label>
              <Input
                id="date-from" type="date" value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">Fecha fin</Label>
              <Input
                id="date-to" type="date" value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="collection-date">Fecha de cargo (opcional)</Label>
              <Input
                id="collection-date" type="date" value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                placeholder="por defecto = fecha fin"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-[#278D33] hover:bg-[#1f6b28] text-white h-10"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</>
                : "Generar remesa"}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Incluirá los pagos <b>pendientes</b> con vencimiento en el rango.
            Se excluyen nadadores sin IBAN o sin mandato activo.
          </p>
        </CardContent>
      </Card>

      {/* Resultado de la última generación */}
      {lastResult && (
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Resultado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Cobros incluidos</p>
                <p className="text-2xl font-semibold">{lastResult.n_txs}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Importe total</p>
                <p className="text-2xl font-semibold">{lastResult.total_amount.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fecha de cargo</p>
                <p className="text-base font-medium">{lastResult.collection_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Excluidos</p>
                <p className="text-2xl font-semibold">{lastResult.n_excluded}</p>
              </div>
            </div>

            {lastResult.warnings?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                {lastResult.warnings.map((w, i) => (<p key={i}>⚠️ {w}</p>))}
              </div>
            )}

            {lastResult.excluded?.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-700">
                  Ver pagos excluidos ({lastResult.excluded.length})
                </summary>
                <ul className="mt-2 ml-4 list-disc text-gray-600">
                  {lastResult.excluded.map((e, i) => (
                    <li key={i}>
                      <code>{e.payment_id}</code> — {e.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <Button
              onClick={() => handleDownload(lastResult.remesa_id, lastResult.message_id)}
              className="bg-[#278D33] hover:bg-[#1f6b28] text-white"
            >
              <Download className="w-4 h-4 mr-2" /> Descargar XML
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Histórico de remesas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="text-center py-6 text-gray-500">Cargando...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No hay remesas todavía</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Message ID</TableHead>
                  <TableHead>Cobros</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Fecha cargo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(r.created_at).toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.message_id}</TableCell>
                    <TableCell>{r.n_txs}</TableCell>
                    <TableCell>{Number(r.total_amount).toFixed(2)} €</TableCell>
                    <TableCell className="text-sm">
                      {r.collection_date ? new Date(r.collection_date).toLocaleDateString("es-ES") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[r.status] || "bg-gray-100"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => handleDownload(r.id, r.message_id)}
                      >
                        <Download className="w-3 h-3 mr-1" /> XML
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
