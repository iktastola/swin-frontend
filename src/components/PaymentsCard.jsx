import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ListOrdered, RefreshCw, Trash2, RotateCcw } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_COLORS = {
  in_remesa: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  returned: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-200 text-red-900",
};

const STATUSES = ["pending", "in_remesa", "paid", "returned", "failed"];

function auth() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function PaymentsCard() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const usersById = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u])),
    [users],
  );

  const loadUsers = async () => {
    try {
      const { data } = await axios.get(`${API}/users`, { headers: auth() });
      setUsers(data || []);
    } catch {
      // silencio: el filtro por nadador simplemente no se podrá usar
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (userFilter) params.set("user_id", userFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const url = `${API}/sepa/payments${params.toString() ? "?" + params : ""}`;
      const { data } = await axios.get(url, { headers: auth() });
      setPayments(data || []);
    } catch (e) {
      toast.error(`Error cargando pagos: ${e.response?.data?.detail || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); load(); }, []);

  const handleRetry = async (id) => {
    try {
      await axios.post(`${API}/sepa/payments/${id}/retry`, null, { headers: auth() });
      toast.success("Pago reencolado como pendiente");
      load();
    } catch (e) {
      toast.error(`Error: ${e.response?.data?.detail || e.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/sepa/payments/${id}`, { headers: auth() });
      toast.success("Pago borrado");
      load();
    } catch (e) {
      toast.error(`Error: ${e.response?.data?.detail || e.message}`);
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleDateString("es-ES"); } catch { return d; }
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
          <ListOrdered className="w-6 h-6" /> Pagos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <Label>Estado</Label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nadador</Label>
            <Select
              value={userFilter || "all"}
              onValueChange={(v) => setUserFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {users.filter(u => u.role === "swimmer").map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Desde</Label>
            <Input type="date" value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" value={dateTo}
              onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button onClick={load} disabled={loading}
            className="bg-[#278D33] hover:bg-[#1f6b28] text-white h-10">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Filtrar
          </Button>
        </div>

        {/* Resumen */}
        <div className="text-sm text-gray-600">
          {payments.length} pagos — total{" "}
          <b>{payments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)} €</b>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="text-center py-6 text-gray-500">Cargando...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-6 text-gray-500">Sin resultados</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nadador</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Motivo devolución</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">
                    {usersById[p.user_id]?.name || p.user_id}
                  </TableCell>
                  <TableCell className="text-sm">{p.concept || "-"}</TableCell>
                  <TableCell className="text-sm">{p.billing_period || "-"}</TableCell>
                  <TableCell className="text-sm">{formatDate(p.due_date)}</TableCell>
                  <TableCell>{Number(p.amount).toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[p.status] || "bg-gray-100"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-red-600">
                    {p.return_reason || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.status === "returned" && (
                        <Button size="sm" variant="outline"
                          onClick={() => handleRetry(p.id)}
                          title="Volver a pendiente para incluirlo en otra remesa"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Reintentar
                        </Button>
                      )}
                      {p.status === "pending" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Borrar pago?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {p.concept} — {Number(p.amount).toFixed(2)} €
                                <br />Solo se pueden borrar pagos en estado <code>pending</code>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => handleDelete(p.id)}
                              >
                                Borrar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
