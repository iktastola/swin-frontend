import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const AuditTool = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    const API = `${BACKEND_URL}/api`;

    const handleAudit = async () => {
        setLoading(true);
        setResult(null);
        const token = localStorage.getItem('token');

        try {
            const response = await axios.post(`${API}/audit`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            setResult(response.data.stats);
            toast.success("Sincronización completada con éxito");
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error al ejecutar la auditoría';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-white/50 border-gray-100 mb-6 overflow-hidden">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#278D33]/10 rounded-full">
                            <RefreshCw className={`w-5 h-5 text-[#278D33] ${loading ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Mantenimiento de Datos</h3>
                            <p className="text-sm text-gray-500">Actualiza todas las mejores marcas y mínimas.</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleAudit}
                        disabled={loading}
                        className={`min-w-[160px] ${loading ? 'bg-gray-400' : 'bg-[#278D33] hover:bg-[#1f6b28]'
                            } text-white shadow-sm transition-all`}
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Sincronizando...
                            </>
                        ) : (
                            'Recalcular Marcas'
                        )}
                    </Button>
                </div>

                {result && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 mb-3 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>¡Sincronización completada!</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatItem
                                label="Nadadores"
                                value={result.swimmers_processed}
                                color="emerald"
                            />
                            <StatItem
                                label="Tiempos"
                                value={result.times_checked}
                                color="emerald"
                            />
                            <StatItem
                                label="PBs Actualizados"
                                value={result.pbs_updated}
                                color="emerald"
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const StatItem = ({ label, value, color }) => (
    <div className={`bg-white p-2 rounded border border-${color}-100 shadow-sm`}>
        <div className="text-xs text-gray-500 uppercase font-semibold">{label}</div>
        <div className={`text-xl font-bold text-${color}-700`}>{value}</div>
    </div>
);

export default AuditTool;
