import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { NavItem } from './components/layout/Sidebar';
import { DataPortal } from './components/data-portal/DataPortal';
import { SQLWorkspace } from './components/sql-workspace/SQLWorkspace';
import { RequestCenter } from './components/request-center/RequestCenter';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TooltipProvider } from './components/ui/tooltip';
import { ToastProvider } from './components/ui/toast';
import { LoginPage } from './components/auth/LoginPage';

export interface TableContext {
  tableName: string;
  schemaName: string;
  databaseName: string;
  assetId?: string;
}

function AppContent() {
  const { user, loading } = useAuth();
  const [activeNav, setActiveNav] = useState<NavItem>('data-portal');
  const [tableContext, setTableContext] = useState<TableContext | null>(null);

  const navigateToSQL = (context: TableContext) => {
    setTableContext(context);
    setActiveNav('sql-workspace');
  };

  const navigateToDataPortal = (context: TableContext) => {
    setTableContext(context);
    setActiveNav('data-portal');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeNav) {
      case 'data-portal':
        return <DataPortal tableContext={tableContext} onNavigateToSQL={navigateToSQL} />;
      case 'sql-workspace':
        return <SQLWorkspace tableContext={tableContext} onNavigateToDataPortal={navigateToDataPortal} />;
      case 'request-center':
        return <RequestCenter />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <DataPortal tableContext={tableContext} onNavigateToSQL={navigateToSQL} />;
    }
  };

  return (
    <MainLayout activeNav={activeNav} onNavChange={setActiveNav}>
      {renderContent()}
    </MainLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
