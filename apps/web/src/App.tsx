import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { WizardProvider } from "./context/WizardContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NewPlanPage } from "./pages/NewPlanPage";
import { PlanDetailPage } from "./pages/PlanDetailPage";
import { RegisterPage } from "./pages/RegisterPage";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WizardProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/plans/new" element={<NewPlanPage />} />
                  <Route path="/plans/:id" element={<PlanDetailPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </WizardProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
