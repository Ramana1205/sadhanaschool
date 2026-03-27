import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
