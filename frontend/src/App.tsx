import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import Login from "./pages/Login";
import Students from "./pages/Students";
import Payments from "./pages/Payments";
import Receipt from "./pages/Receipt";
import HallTicket from "./pages/HallTicket";
import ReportCard from "./pages/ReportCard";
import Bonafide from "./pages/Bonafide";
import FeeCatalog from "./pages/FeeCatalog";
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

const router = createBrowserRouter(
  [
    { path: '/login', element: <Login /> },
    { path: '/', element: <Navigate to="/login" replace /> },
    {
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: '/dashboard', element: <DashboardEntry /> },
        { path: '/admin-dashboard', element: <RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute> },
        { path: '/faculty-dashboard', element: <RoleRoute allowedRoles={["faculty"]}><FacultyDashboard /></RoleRoute> },
        { path: '/admin-settings', element: <RoleRoute allowedRoles={["admin"]}><AdminSettings /></RoleRoute> },
        { path: '/faculty-management', element: <RoleRoute allowedRoles={["admin"]}><FacultyManagement /></RoleRoute> },
        { path: '/faculty-schedule', element: <RoleRoute allowedRoles={["faculty"]}><FacultySchedule /></RoleRoute> },
        { path: '/students', element: <Students /> },
        { path: '/fee-catalog', element: <RoleRoute allowedRoles={["admin"]}><FeeCatalog /></RoleRoute> },
        { path: '/payments', element: <Payments /> },
        { path: '/receipt', element: <Receipt /> },
        { path: '/hall-ticket', element: <HallTicket /> },
        { path: '/report-card', element: <ReportCard /> },
        { path: '/bonafide', element: <Bonafide /> },
      ],
    },
    { path: '*', element: <NotFound /> },
  ],
  {
    future: { v7_relativeSplatPath: true },
  }
);

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
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
