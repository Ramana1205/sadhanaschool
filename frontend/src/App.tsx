import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Payments from "./pages/Payments";
import Receipt from "./pages/Receipt";
import HallTicket from "./pages/HallTicket";
import ReportCard from "./pages/ReportCard";
import Bonafide from "./pages/Bonafide";
import AdminSettings from "./pages/AdminSettings";
import FacultyDashboard from "./pages/FacultyDashboard";
import FacultySchedule from "./pages/FacultySchedule";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import DashboardLayout from "./components/DashboardLayout";
import DashboardEntry from "./pages/DashboardEntry";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyManagement from "./pages/FacultyManagement";

const queryClient = new QueryClient();

const App = () => {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    const { loadStudents, loadPayments } = useStudentStore.getState();
    loadStudents();
    loadPayments();
  }, [token]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardEntry />} />
            <Route path="/admin-dashboard" element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} />
            <Route path="/faculty-dashboard" element={<RoleRoute allowedRoles={["faculty"]}><FacultyDashboard /></RoleRoute>} />
            <Route path="/admin-settings" element={<RoleRoute allowedRoles={["admin"]}><AdminSettings /></RoleRoute>} />
            <Route path="/faculty-management" element={<RoleRoute allowedRoles={["admin"]}><FacultyManagement /></RoleRoute>} />
            <Route path="/faculty-schedule" element={<RoleRoute allowedRoles={["faculty"]}><FacultySchedule /></RoleRoute>} />
            <Route path="/students" element={<Students />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/receipt" element={<Receipt />} />
            <Route path="/hall-ticket" element={<HallTicket />} />
            <Route path="/report-card" element={<ReportCard />} />
            <Route path="/bonafide" element={<Bonafide />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    );
};
export default App;
