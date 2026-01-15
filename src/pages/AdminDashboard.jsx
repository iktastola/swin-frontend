import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus, Users, Shirt, Clock } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import UsersTable from "@/components/UsersTable";
import LockersManagement from "@/components/LockersManagement";
import AddUserDialog from "@/components/AddUserDialog";
import EditUserDialog from "@/components/EditUserDialog";
import SwimTimesTable from "@/components/SwimTimesTable";
import AddTimeDialog from "@/components/AddTimeDialog";
import EditTimeDialog from "@/components/EditTimeDialog";
import SwimmerSelector from "@/components/SwimmerSelector";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import EditProfileDialog from "@/components/EditProfileDialog";
import AuditTool from "@/components/AuditTool";


const DISTANCES = [50, 100, 200, 400, 800, 1500];
const STYLES = ["Libre", "Espalda", "Braza", "Mariposa", "Estilos"];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [allTimes, setAllTimes] = useState([]);
  const [times, setTimes] = useState([]);

  // Filter States
  const [selectedSwimmer, setSelectedSwimmer] = useState(null);
  const [filterDistance, setFilterDistance] = useState("all");
  const [filterStyle, setFilterStyle] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterLogic, setFilterLogic] = useState("AND");
  const [filterMinimaEH, setFilterMinimaEH] = useState("all");
  const [filterMinimaBizkaia, setFilterMinimaBizkaia] = useState("all");

  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);

  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showAddTimeDialog, setShowAddTimeDialog] = useState(false);
  const [showEditTimeDialog, setShowEditTimeDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingTime, setEditingTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchAllTimes();
  }, []);

  // Filter Effect
  useEffect(() => {
    let result = allTimes;
    // Si no hay filtros activos, mostrar todo
    const isFiltering = selectedSwimmer || filterDistance !== "all" || filterStyle !== "all" || filterDate || filterMinimaEH !== "all" || filterMinimaBizkaia !== "all";

    if (isFiltering) {
      if (filterLogic === "AND") {
        result = result.filter(t => {
          const matchSwimmer = !selectedSwimmer || t.swimmer_id === selectedSwimmer;
          const matchDistance = filterDistance === "all" || t.distance.toString() === filterDistance;
          const matchStyle = filterStyle === "all" || t.style === filterStyle;
          const matchDate = !filterDate || t.date.startsWith(filterDate);
          const matchMinimaEH = filterMinimaEH === "all" || t.minima_eh === filterMinimaEH;
          const matchMinimaBizkaia = filterMinimaBizkaia === "all" || t.minima_bizkaia === filterMinimaBizkaia;
          return matchSwimmer && matchDistance && matchStyle && matchDate && matchMinimaEH && matchMinimaBizkaia;
        });
      } else {
        // OR Logic
        result = result.filter(t => {
          const matchSwimmer = selectedSwimmer && t.swimmer_id === selectedSwimmer;
          const matchDistance = filterDistance !== "all" && t.distance.toString() === filterDistance;
          const matchStyle = filterStyle !== "all" && t.style === filterStyle;
          const matchDate = filterDate && t.date.startsWith(filterDate);
          const matchMinimaEH = filterMinimaEH !== "all" && t.minima_eh === filterMinimaEH;
          const matchMinimaBizkaia = filterMinimaBizkaia !== "all" && t.minima_bizkaia === filterMinimaBizkaia;
          return matchSwimmer || matchDistance || matchStyle || matchDate || matchMinimaEH || matchMinimaBizkaia;
        });
      }
    }

    setTimes(result);
  }, [allTimes, selectedSwimmer, filterDistance, filterStyle, filterDate, filterLogic, filterMinimaEH, filterMinimaBizkaia]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/users`, { headers });
      setUsers(response.data);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTimes = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API}/times`, { headers });
      setAllTimes(response.data);
    } catch (error) {
      toast.error("Error al cargar tiempos");
    }
  };



  const handleAddUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/auth/register`, userData, { headers });
      toast.success("Usuario creado correctamente");
      setShowAddUserDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear usuario");
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/users/${editingUser.id}`, userData, { headers });
      toast.success("Usuario actualizado correctamente");
      setShowEditUserDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al actualizar usuario");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/users/${userId}`, { headers });
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (error) {
      toast.error("Error al eliminar usuario");
    }
  };

  const handleAddTime = async (timeData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/times`, timeData, { headers });
      toast.success("Tiempo registrado correctamente");
      setShowAddTimeDialog(false);
      toast.success("Tiempo registrado correctamente");
      setShowAddTimeDialog(false);
      fetchAllTimes();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al registrar tiempo");
    }
  };

  const handleEditTime = (time) => {
    setEditingTime(time);
    setShowEditTimeDialog(true);
  };

  const handleUpdateTime = async (timeData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/times/${editingTime.id}`, timeData, { headers });
      toast.success("Tiempo actualizado correctamente");
      setShowEditTimeDialog(false);
      setEditingTime(null);
      fetchAllTimes();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al actualizar tiempo");
    }
  };

  const handleDeleteTime = async (timeId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API}/times/${timeId}`, { headers });
      toast.success("Tiempo eliminado");
      fetchAllTimes();
    } catch (error) {
      toast.error("Error al eliminar tiempo");
    }
  };

  const swimmers = users.filter(u => u.role === 'swimmer');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#278D33]">Panel de Administración</h1>
              <p className="text-gray-600 mt-1">Gestión completa del club - {user.name}</p>
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
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-3 bg-white shadow-md">
            <TabsTrigger value="users" className="data-[state=active]:bg-[#278D33] data-[state=active]:text-white" data-testid="users-tab">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="times" className="data-[state=active]:bg-[#278D33] data-[state=active]:text-white" data-testid="times-tab">
              <Clock className="w-4 h-4 mr-2" />
              Tiempos
            </TabsTrigger>
            <TabsTrigger value="lockers" className="data-[state=active]:bg-[#278D33] data-[state=active]:text-white" data-testid="lockers-tab">
              <Shirt className="w-4 h-4 mr-2" />
              Taquillas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="fade-in">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl text-gray-900">Gestión de Usuarios</CardTitle>
                  <Button
                    onClick={() => setShowAddUserDialog(true)}
                    className="bg-[#278D33] hover:bg-[#1f6b28] text-white"
                    data-testid="add-user-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Cargando...</div>
                ) : (
                  <UsersTable users={users} onDelete={handleDeleteUser} onEdit={handleEditUser} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="times" className="fade-in">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <AuditTool />
                <div className="flex flex-col gap-6">

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-2xl text-gray-900">Gestión de Tiempos</CardTitle>
                    <Button
                      onClick={() => setShowAddTimeDialog(true)}
                      className="bg-[#278D33] hover:bg-[#1f6b28] text-white"
                      data-testid="add-time-button"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Tiempo
                    </Button>
                  </div>

                  {/* Filters Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
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
                      <Label className="text-xs text-gray-500 font-semibold uppercase">Nadador</Label>
                      <SwimmerSelector
                        swimmers={swimmers}
                        selectedSwimmer={selectedSwimmer}
                        onSelectSwimmer={setSelectedSwimmer}
                      />
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
                  <SwimTimesTable
                    times={times}
                    swimmers={swimmers}
                    onDelete={handleDeleteTime}
                    onEdit={handleEditTime}
                    showActions
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lockers" className="fade-in">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Gestión de Taquillas</CardTitle>
              </CardHeader>
              <CardContent>
                <LockersManagement swimmers={swimmers} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AddUserDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onSubmit={handleAddUser}
      />

      <EditUserDialog
        open={showEditUserDialog}
        onOpenChange={setShowEditUserDialog}
        onSubmit={handleUpdateUser}
        user={editingUser}
      />

      <AddTimeDialog
        open={showAddTimeDialog}
        onOpenChange={setShowAddTimeDialog}
        onSubmit={handleAddTime}
        swimmers={swimmers}
      />

      <EditTimeDialog
        open={showEditTimeDialog}
        onOpenChange={setShowEditTimeDialog}
        onSubmit={handleUpdateTime}
        time={editingTime}
        swimmers={swimmers}
      />


      <EditProfileDialog
        open={showEditProfileDialog}
        onOpenChange={setShowEditProfileDialog}
        user={user}
        onUserUpdated={(updatedUser) => {
          window.location.reload();
        }}
      />
    </div>
  );
}
