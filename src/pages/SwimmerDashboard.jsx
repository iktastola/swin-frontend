import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Trophy, Clock, Shirt } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import SwimTimesTable from "@/components/SwimTimesTable";
import PersonalBestsTable from "@/components/PersonalBestsTable";
import LockerView from "@/components/LockerView";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User as UserIcon } from "lucide-react";
import EditProfileDialog from "@/components/EditProfileDialog";

const DISTANCES = [50, 100, 200, 400, 800, 1500];
const STYLES = ["Libre", "Espalda", "Braza", "Mariposa", "Estilos"];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SwimmerDashboard({ user, onLogout, onUserUpdate }) {
  const [allTimes, setAllTimes] = useState([]);
  const [times, setTimes] = useState([]);
  const [personalBests, setPersonalBests] = useState([]);
  const [locker, setLocker] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterDistance, setFilterDistance] = useState("all");
  const [filterStyle, setFilterStyle] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterLogic, setFilterLogic] = useState("AND");
  const [filterMinimaEH, setFilterMinimaEH] = useState("all");
  const [filterMinimaBizkaia, setFilterMinimaBizkaia] = useState("all");

  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Effect
  useEffect(() => {
    let result = allTimes;
    // Si no hay filtros activos, mostrar todo
    const isFiltering = filterDistance !== "all" || filterStyle !== "all" || filterDate || filterMinimaEH !== "all" || filterMinimaBizkaia !== "all";

    if (isFiltering) {
      if (filterLogic === "AND") {
        result = result.filter(t => {
          const matchDistance = filterDistance === "all" || t.distance.toString() === filterDistance;
          const matchStyle = filterStyle === "all" || t.style === filterStyle;
          const matchDate = !filterDate || t.date.startsWith(filterDate);
          const matchMinimaEH = filterMinimaEH === "all" || t.minima_eh === filterMinimaEH;
          const matchMinimaBizkaia = filterMinimaBizkaia === "all" || t.minima_bizkaia === filterMinimaBizkaia;
          return matchDistance && matchStyle && matchDate && matchMinimaEH && matchMinimaBizkaia;
        });
      } else {
        // OR Logic
        result = result.filter(t => {
          const matchDistance = filterDistance !== "all" && t.distance.toString() === filterDistance;
          const matchStyle = filterStyle !== "all" && t.style === filterStyle;
          const matchDate = filterDate && t.date.startsWith(filterDate);
          const matchMinimaEH = filterMinimaEH !== "all" && t.minima_eh === filterMinimaEH;
          const matchMinimaBizkaia = filterMinimaBizkaia !== "all" && t.minima_bizkaia === filterMinimaBizkaia;
          return matchDistance || matchStyle || matchDate || matchMinimaEH || matchMinimaBizkaia;
        });
      }
    }

    setTimes(result);
  }, [allTimes, filterDistance, filterStyle, filterDate, filterLogic, filterMinimaEH, filterMinimaBizkaia]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [timesRes, pbRes, lockerRes] = await Promise.all([
        axios.get(`${API}/times`, { headers }),
        axios.get(`${API}/personal-bests`, { headers }),
        axios.get(`${API}/lockers/${user.id}`, { headers }).catch(() => ({ data: null }))
      ]);

      setAllTimes(timesRes.data);
      setTimes(timesRes.data);
      setPersonalBests(pbRes.data);
      setLocker(lockerRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpload = async (data) => {
    let successCount = 0;
    let failCount = 0;
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const uploadPromise = new Promise(async (resolve) => {
      for (const time of data) {
        try {
          await axios.post(`${API}/times`, time, { headers });
          successCount++;
        } catch (error) {
          failCount++;
          console.error("Error uploading time:", error);
        }
      }
      resolve();
    });

    toast.promise(uploadPromise, {
      loading: 'Subiendo tiempos...',
      success: () => {
        fetchData();
        return `Subida completada: ${successCount} éxito, ${failCount} error(es)`;
      },
      error: 'Error crítico en la subida',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-[#278D33]/20 shadow-sm">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-[#278D33]/10 text-[#278D33]">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#278D33]">Club de Natación Astola</h1>
                <p className="text-gray-600 mt-0.5">Bienvenido, {user.name}</p>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="border-[#278D33] text-[#278D33] hover:bg-[#278D33] hover:text-white"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              className="text-sm text-[#278D33]"
              onClick={() => setShowEditProfileDialog(true)}
            >
              Mi Perfil
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="times" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 bg-white shadow-md">
            <TabsTrigger value="times" className="data-[state=active]:bg-[#278D33] data-[state=active]:text-white" data-testid="times-tab">
              <Clock className="w-4 h-4 mr-2" />
              Mis Tiempos
            </TabsTrigger>
            <TabsTrigger value="bests" className="data-[state=active]:bg-[#278D33] data-[state=active]:text-white" data-testid="bests-tab">
              <Trophy className="w-4 h-4 mr-2" />
              Mejores Marcas
            </TabsTrigger>
            <TabsTrigger value="locker" className="data-[state=active]:bg-[#278D33] data-[state=active]:text-white" data-testid="locker-tab">
              <Shirt className="w-4 h-4 mr-2" />
              Mi Taquilla
            </TabsTrigger>
          </TabsList>

          <TabsContent value="times" className="fade-in">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col gap-6">
                  <CardTitle className="text-2xl text-gray-900">Mis Tiempos de Natación</CardTitle>

                  {/* Filters Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 font-semibold uppercase">Lógica de Filtro</Label>
                      <Select value={filterLogic} onValueChange={setFilterLogic}>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">Y (Cumplir todos)</SelectItem>
                          <SelectItem value="OR">O (Cumplir alguno)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 font-semibold uppercase">Distancia</Label>
                      <Select value={filterDistance} onValueChange={setFilterDistance}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {DISTANCES.map(d => (
                            <SelectItem key={d} value={d.toString()}>{d}m</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 font-semibold uppercase">Estilo</Label>
                      <Select value={filterStyle} onValueChange={setFilterStyle}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {STYLES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 font-semibold uppercase">Fecha</Label>
                      <Input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 font-semibold uppercase">Mínima EH</Label>
                      <Select value={filterMinimaEH} onValueChange={setFilterMinimaEH}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="si">SI</SelectItem>
                          <SelectItem value="no">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 font-semibold uppercase">Mínima Bizkaia</Label>
                      <Select value={filterMinimaBizkaia} onValueChange={setFilterMinimaBizkaia}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="si">SI</SelectItem>
                          <SelectItem value="no">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : (
                  <SwimTimesTable times={times} onUpload={handleBatchUpload} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bests" className="fade-in">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-[#278D33]" />
                  Mis Mejores Marcas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : (
                  <PersonalBestsTable personalBests={personalBests} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locker" className="fade-in">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Mi Taquilla Virtual</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : (
                  <LockerView locker={locker} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <EditProfileDialog
        open={showEditProfileDialog}
        onOpenChange={setShowEditProfileDialog}
        user={user}
        onUserUpdated={(updatedUser) => {
          if (onUserUpdate) onUserUpdate(updatedUser);
        }}
      />
    </div >
  );
}
