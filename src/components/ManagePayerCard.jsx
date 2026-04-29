import { useEffect, useState } from "react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserCog, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function auth() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function ManagePayerCard() {
  const [swimmers, setSwimmers] = useState([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado actual
  const [bank, setBank] = useState(null);          // BankAccountPublic | null
  const [mandate, setMandate] = useState(null);    // Mandate activo | null
  const [fullIban, setFullIban] = useState(null);  // IBAN revelado

  // Formulario IBAN
  const [iban, setIban] = useState("");
  const [holder, setHolder] = useState("");
  const [bic, setBic] = useState("");

  // Formulario mandato
  const [signatureDate, setSignatureDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    axios.get(`${API}/users`, { headers: auth() })
      .then(({ data }) => setSwimmers(
        (data || []).filter((u) => u.role === "swimmer")
      ))
      .catch(() => toast.error("Error cargando nadadores"));
  }, []);

  const loadPayer = async (uid) => {
    setLoading(true);
    setBank(null); setMandate(null); setFullIban(null);
    try {
      // IBAN
      try {
        const { data } = await axios.get(
          `${API}/sepa/bank-accounts/${uid}`, { headers: auth() }
        );
        setBank(data);
        setHolder(data.holder_name || "");
        setBic(data.bic || "");
      } catch (e) {
        if (e.response?.status !== 404) throw e;
      }
      setIban("");  // no se precarga (no lo tenemos en claro)

      // Mandato activo
      const { data: mlist } = await axios.get(
        `${API}/sepa/mandates?user_id=${uid}&status=active`, { headers: auth() }
      );
      setMandate(mlist?.[0] || null);
    } catch (e) {
      toast.error(`Error cargando datos: ${e.response?.data?.detail || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (userId) loadPayer(userId); }, [userId]);

  const handleSaveIban = async () => {
    if (!userId || !iban || !holder) {
      toast.error("Faltan datos: nadador, IBAN y titular son obligatorios");
      return;
    }
    try {
      await axios.post(`${API}/sepa/bank-accounts`, {
        user_id: userId,
        iban: iban.replace(/\s/g, ""),
        holder_name: holder,
        bic: bic || null,
      }, { headers: auth() });
      toast.success("IBAN guardado");
      setIban("");
      loadPayer(userId);
    } catch (e) {
      toast.error(`Error: ${e.response?.data?.detail || e.message}`);
    }
  };

  const handleRevealIban = async () => {
    if (fullIban) { setFullIban(null); return; }
    try {
      const { data } = await axios.get(
        `${API}/sepa/bank-accounts/${userId}/full`, { headers: auth() }
      );
      setFullIban(data.iban);
    } catch (e) {
      toast.error(`Error: ${e.response?.data?.detail || e.message}`);
    }
  };

  const handleDeleteIban = async () => {
    try {
      await axios.delete(`${API}/sepa/bank-accounts/${userId}`, { headers: auth() });
      toast.success("IBAN borrado");
      setBank(null); setFullIban(null); setIban(""); setHolder(""); setBic("");
    } catch (e) {
      toast.error(`Error: ${e.response?.data?.detail || e.message}`);
    }
  };

  const handleCreateMandate = async () => {
    if (!userId || !signatureDate) {
      toast.error("Indica fecha de firma");
      return;
    }
    try {
      await axios.post(`${API}/sepa/mandates`, {
        user_id: userId,
        signature_date: signatureDate,
        type: "RCUR",
      }, { headers: auth() });
      toast.success("Mandato creado");
      loadPayer(userId);
    } catch (e) {
      toast.error(`Error: ${e.response?.data?.detail || e.message}`);
    }
  };

  const handleCancelMandate = async () => {
    if (!mandate) return;
    try {
      await axios.delete(
        `${API}/sepa/mandates/${mandate.mandate_id}`, { headers: auth() },
      );
      toast.success("Mandato cancelado");
      loadPayer(userId);
    } catch (e) {
      toast.error(`Error: ${e.response?.data?.detail || e.message}`);
    }
  };

  const selected = swimmers.find((s) => s.id === userId);

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
          <UserCog className="w-6 h-6" /> IBAN y mandato por nadador
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label>Nadador</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un nadador" />
            </SelectTrigger>
            <SelectContent>
              {swimmers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {s.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="text-center py-4 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Cargando...
          </div>
        )}

        {userId && !loading && (
          <>
            {/* IBAN ----------------------------------------------------- */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-gray-700">Cuenta bancaria</h3>

              {bank ? (
                <div className="mb-3 flex items-center gap-3 bg-gray-50 rounded p-3 text-sm">
                  <span className="font-mono">
                    {fullIban || bank.iban_masked}
                  </span>
                  <Button size="sm" variant="ghost" onClick={handleRevealIban}>
                    {fullIban
                      ? <><EyeOff className="w-3 h-3 mr-1" /> Ocultar</>
                      : <><Eye className="w-3 h-3 mr-1" /> Ver completo</>}
                  </Button>
                  <span className="ml-auto text-gray-500">
                    titular: <b>{bank.holder_name}</b>
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Borrar el IBAN de {selected?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se elimina el IBAN cifrado de la BBDD. El nadador
                          dejará de poder entrar en remesas hasta que vuelvas
                          a darlo de alta.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleDeleteIban}
                        >
                          Borrar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">Sin IBAN guardado.</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <Label htmlFor="mp-iban">IBAN nuevo</Label>
                  <Input id="mp-iban" value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="ES76 2077 0024 0031 0257 5766"
                  />
                </div>
                <div>
                  <Label htmlFor="mp-holder">Titular</Label>
                  <Input id="mp-holder" value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    placeholder="Nombre del titular"
                  />
                </div>
                <div>
                  <Label htmlFor="mp-bic">BIC (opcional)</Label>
                  <Input id="mp-bic" value={bic}
                    onChange={(e) => setBic(e.target.value)}
                    placeholder="BASKES2BXXX"
                  />
                </div>
              </div>
              <Button
                onClick={handleSaveIban}
                className="mt-3 bg-[#278D33] hover:bg-[#1f6b28] text-white"
              >
                {bank ? "Actualizar IBAN" : "Guardar IBAN"}
              </Button>
            </div>

            {/* MANDATO --------------------------------------------------- */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2 text-gray-700">Mandato SEPA</h3>

              {mandate ? (
                <div className="mb-3 bg-gray-50 rounded p-3 text-sm flex flex-wrap gap-3 items-center">
                  <span className="font-mono text-xs">{mandate.mandate_id}</span>
                  <span>firmado: {mandate.signature_date}</span>
                  <span>tipo: {mandate.type}</span>
                  <Badge className={mandate.first_used_at
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"}>
                    {mandate.first_used_at ? "usado (RCUR)" : "nuevo (FRST)"}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline"
                        className="ml-auto text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Cancelar mandato
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar este mandato?</AlertDialogTitle>
                        <AlertDialogDescription>
                          El mandato quedará en estado <code>cancelled</code> y no
                          se usará en futuras remesas. Los pagos ya en remesa
                          no se tocan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleCancelMandate}
                        >
                          Sí, cancelar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">Sin mandato activo.</p>
              )}

              {!mandate && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <Label htmlFor="mp-sig">Fecha de firma</Label>
                    <Input id="mp-sig" type="date" value={signatureDate}
                      onChange={(e) => setSignatureDate(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateMandate}
                    className="bg-[#278D33] hover:bg-[#1f6b28] text-white"
                  >
                    Crear mandato RCUR
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
