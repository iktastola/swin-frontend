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
import { Checkbox } from "@/components/ui/checkbox";
import ManagePayerCard from "@/components/ManagePayerCard";
import PaymentsCard from "@/components/PaymentsCard";
import {
  Download, FileText, Loader2, Trash2, CalendarPlus, Settings2, CheckCircle2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_COLORS = {
  generated: "bg-blue-100 text-blue-800",
  partially_returned: "bg-amber-100 text-amber-800",
  closed: "bg-gray-200 text-gray-800",
  sent: "bg-green-100 text-green-800",
};

const PAYMENT_STATUS_COLORS = {
  in_remesa: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  returned: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-200 text-red-900",
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

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ManageRemesaDialog({ remesa, onChanged }) {
  const [open, setOpen] = useState(false);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [closing, setClosing] = useState(false);
  const [selected, setSelected] = useState({});   // payment_id -> true/false
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API}/sepa/remesas/${remesa.id}/payments`,
        { headers: authHeaders() },
      );
      setPagos(data || []);
      setSelected({});
    } catch (e) {
      toast.error("Error cargando pagos de la remesa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open, remesa.id]);

  const toggle = (pid) => setSelected((s) => ({ ...s, [pid]: !s[pid] }));

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);

  const handleMarkReturns = async () => {
    if (selectedIds.length === 0) {
      toast.error("Selecciona al menos un pago");
      return;
    }
    if (!reason.trim()) {
      toast.error("Escribe el motivo de devolución");
      return;
    }
    setMarking(true);
    try {
      const body = {
        returns: selectedIds.map((pid) => ({ payment_id: pid, reason })),
      };
      const { data } = await axios.post(
        `${API}/sepa/remesas/${remesa.id}/returns`,
        body, { headers: authHeaders() },
      );
      toast.success(`Devoluciones marcadas: ${data.updated.length}`);
      setReason("");
      await load();
      onChanged?.();
    } catch (err) {
      toast.error(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setMarking(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      const { data } = await axios.post(
        `${API}/sepa/remesas/${remesa.id}/close`,
        null, { headers: authHeaders() },
      );
      toast.success(`Remesa cerrada. ${data.marked_paid} pago(s) marcado(s) como pagados.`);
      await load();
      onChanged?.();
      setOpen(false);
    } catch (err) {
      toast.error(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setClosing(false);
    }
  };

  const pendingInRemesa = pagos.filter((p) => p.status === "in_remesa").length;
  const isClosed = remesa.status === "closed";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Settings2 className="w-3 h-3 mr-1" /> Gestionar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar remesa</DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs">{remesa.message_id}</span> —
            {" "}{remesa.n_txs} cobros, {Number(remesa.total_amount).toFixed(2)} €
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Cargando...</div>
        ) : (
          <>
            <div className="space-y-2 max-h-80 overflow-y-auto border rounded p-2">
              {pagos.map((p) => {
                const disabled = p.status !== "in_remesa" || isClosed;
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-2 rounded ${disabled ? "opacity-50" : "hover:bg-gray-50 cursor-pointer"}`}
                  >
                    <Checkbox
                      checked={!!selected[p.id]}
                      disabled={disabled}
                      onCheckedChange={() => !disabled && toggle(p.id)}
                    />
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{p.user_name || p.user_id}</div>
                      <div className="text-xs text-gray-500">
                        {p.concept} — {Number(p.amount).toFixed(2)} €
                        {p.return_reason && <span className="ml-2 text-red-600">({p.return_reason})</span>}
                      </div>
                    </div>
                    <Badge className={PAYMENT_STATUS_COLORS[p.status] || "bg-gray-100"}>
                      {p.status}
                    </Badge>
                  </label>
                );
              })}
            </div>

            {!isClosed && (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label htmlFor="reason">Motivo de devolución</Label>
                  <Input
                    id="reason" value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="p.ej. AC04 cuenta cerrada"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleMarkReturns}
                    disabled={marking || selectedIds.length === 0}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {marking
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Marcando...</>
                      : <>Marcar como devueltos ({selectedIds.length})</>}
                  </Button>

                  {pendingInRemesa > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-[#278D33] hover:bg-[#1f6b28] text-white">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Cerrar remesa ({pendingInRemesa} → pagados)
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cerrar la remesa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Los <b>{pendingInRemesa}</b> pagos restantes en estado{" "}
                            <code>in_remesa</code> pasarán a <code>paid</code>.
                            Úsalo solo cuando hayan pasado los días hábiles de devolución
                            (5 días laborables tras la fecha de cargo).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={closing}
                            className="bg-[#278D33] hover:bg-[#1f6b28]"
                            onClick={handleClose}
                          >
                            {closing ? "Cerrando..." : "Sí, cerrar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )}

            {isClosed && (
              <div className="bg-gray-100 border rounded p-3 text-sm text-gray-700">
                Esta remesa ya está cerrada.
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar diálogo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SepaPanel() {
  const [dateFrom, setDateFrom] = useState(firstOfCurrentMonth());
  const [dateTo, setDateTo] = useState(lastOfCurrentMonth());
  const [collectionDate, setCollectionDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Facturar mes
  const [billingMonth, setBillingMonth] = useState(currentMonthKey());
  const [billing, setBilling] = useState(false);
  const [billingResult, setBillingResult] = useState(null);

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

  const handleBilling = async () => {
    if (!/^\d{4}-\d{2}$/.test(billingMonth)) {
      toast.error("Formato de mes inválido, usa YYYY-MM");
      return;
    }
    setBilling(true);
    setBillingResult(null);
    try {
      const { data } = await axios.post(
        `${API}/sepa/billing/run?month=${billingMonth}`,
        null,
        { headers: authHeaders() },
      );
      setBillingResult(data);
      toast.success(
        `Facturación ${billingMonth}: ${data.created} creados, ${data.already_billed} ya facturados`
      );
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      toast.error(`Error: ${msg}`);
    } finally {
      setBilling(false);
    }
  };

  const handleDeleteRemesa = async (remesaId) => {
    try {
      const { data } = await axios.delete(
        `${API}/sepa/remesas/${remesaId}`,
        { headers: authHeaders() },
      );
      toast.success(
        `Remesa borrada. ${data.reverted_to_pending} pago(s) vuelto(s) a pendiente.`
      );
      fetchHistory();
      if (lastResult?.remesa_id === remesaId) setLastResult(null);
    } catch (err) {
      toast.error(`Error: ${err.response?.data?.detail || err.message}`);
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

      {/* Gestionar nadador (IBAN + mandato) */}
      <ManagePayerCard />

      {/* Facturar mes */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <CalendarPlus className="w-6 h-6" /> Facturar mes (45€/nadador)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="billing-month">Mes (YYYY-MM)</Label>
              <Input
                id="billing-month"
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
              />
            </div>
            <Button
              onClick={handleBilling}
              disabled={billing}
              className="bg-[#278D33] hover:bg-[#1f6b28] text-white h-10"
            >
              {billing
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Facturando...</>
                : "Generar pagos del mes"}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Crea un pago de 45€ por cada nadador con IBAN + mandato activo.
            Idempotente: si ya hay pago para ese mes, no se duplica.
            Solo permite meses de sep–jun (temporada).
          </p>

          {billingResult && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm border-t pt-4">
              <div>
                <p className="text-xs text-gray-500">Nadadores</p>
                <p className="text-xl font-semibold">{billingResult.total_swimmers}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Creados</p>
                <p className="text-xl font-semibold text-green-600">{billingResult.created}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ya facturados</p>
                <p className="text-xl font-semibold text-gray-500">{billingResult.already_billed}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sin IBAN</p>
                <p className="text-xl font-semibold text-amber-600">{billingResult.missing_iban}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sin mandato</p>
                <p className="text-xl font-semibold text-amber-600">{billingResult.missing_mandate}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Pagos */}
      <PaymentsCard />

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
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handleDownload(r.id, r.message_id)}
                        >
                          <Download className="w-3 h-3 mr-1" /> XML
                        </Button>
                        <ManageRemesaDialog remesa={r} onChanged={fetchHistory} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm" variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Borrar esta remesa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                <p className="mb-2">
                                  <b>{r.message_id}</b> — {r.n_txs} cobros por {Number(r.total_amount).toFixed(2)}€
                                </p>
                                <p className="text-sm">
                                  Los pagos en <code>in_remesa</code> volverán a <code>pending</code>.
                                  Los pagos ya <code>paid</code> o <code>returned</code> no se tocarán.
                                </p>
                                <p className="text-sm mt-2 text-red-600">
                                  ⚠️ Si ya subiste este XML a Kutxabank, el banco lo ejecutará igual.
                                  Esto solo afecta a tu BBDD.
                                </p>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDeleteRemesa(r.id)}
                              >
                                Borrar remesa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
