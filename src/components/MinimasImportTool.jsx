import { useState, useRef } from 'react';
import axios from 'axios';
import { API_URL as API } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Upload, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const COLLECTIONS = [
    { value: 'BizkaiaMinimas', label: 'Mínimas Bizkaia' },
    { value: 'EHMinimas', label: 'Mínimas Euskal Herria' },
];

const MinimasImportTool = () => {
    const [loading, setLoading] = useState(false);
    const [collection, setCollection] = useState('BizkaiaMinimas');
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                const documentos = Array.isArray(parsed) ? parsed : [parsed];
                importDocs(documentos);
            } catch (err) {
                toast.error('JSON no válido: ' + err.message);
            }
            e.target.value = "";
        };
        reader.readAsText(file);
    };

    const importDocs = async (documentos) => {
        setLoading(true);
        setResult(null);

        try {
            const response = await axios.post(
                `${API}/admin/minimas/import`,
                { collection, documentos }
            );
            setResult(response.data);
            toast.success(`Mínimas importadas: ${response.data.inserted} nuevas, ${response.data.updated} actualizadas`);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error al importar mínimas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-white/50 border-gray-100 mb-6 overflow-hidden">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-full">
                            <Database className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Importar Mínimas</h3>
                            <p className="text-sm text-gray-500">
                                Sube un JSON (un documento o una lista). Se insertan/actualizan por prueba, distancia y piscina.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={collection} onValueChange={setCollection}>
                            <SelectTrigger className="min-w-[170px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {COLLECTIONS.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className={`min-w-[140px] ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-sm`}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {loading ? 'Importando...' : 'Subir JSON'}
                        </Button>
                    </div>
                </div>

                {result && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-3 text-blue-800 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Importación a {result.collection}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                                <div className="text-xs text-gray-500 uppercase font-semibold">Nuevas</div>
                                <div className="text-xl font-bold text-blue-700">{result.inserted}</div>
                            </div>
                            <div className="bg-white p-2 rounded border border-blue-100 shadow-sm">
                                <div className="text-xs text-gray-500 uppercase font-semibold">Actualizadas</div>
                                <div className="text-xl font-bold text-blue-700">{result.updated}</div>
                            </div>
                        </div>
                        {result.errors?.length > 0 && (
                            <div className="mt-3 flex items-start gap-2 text-amber-700 text-sm">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    {result.errors.map((e, i) => <div key={i}>{e}</div>)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MinimasImportTool;
