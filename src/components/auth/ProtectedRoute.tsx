import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMerchant?: boolean;
}

const ProtectedRoute = ({ children, requireMerchant = false }: ProtectedRouteProps) => {
  const { user, loading, isMerchant } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requireMerchant && !isMerchant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Accès refusé</h1>
        <p className="text-muted-foreground mb-4">
          Vous n'avez pas les droits pour accéder à cette page.
        </p>
        <a href="/" className="text-primary hover:underline">
          Retour à l'accueil
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
