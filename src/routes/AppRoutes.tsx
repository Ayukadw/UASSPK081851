import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { VerificatorLayout } from '@/layouts/VerificatorLayout';
import { OperatorLayout } from '@/layouts/OperatorLayout';
import { PublicLayout } from '@/layouts/PublicLayout';

import { LoginPage } from '@/pages/auth/LoginPage';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { UserManagement } from '@/pages/admin/UserManagement';
import { CriteriaManagement } from '@/pages/admin/CriteriaManagement';

import { VerificatorDashboard } from '@/pages/verificator/VerificatorDashboard';
import { AHPInputPage } from '@/pages/verificator/AHPInputPage';
import { AHPResultPage } from '@/pages/verificator/AHPResultPage';

import { OperatorDashboard } from '@/pages/operator/OperatorDashboard';
import { AlternativeManagement } from '@/pages/operator/AlternativeManagement';
import { DecisionMatrixPage } from '@/pages/operator/DecisionMatrixPage';
import { MARCOSResultPage } from '@/pages/operator/MARCOSResultPage';

import { PublicRankingPage } from '@/pages/public/PublicRankingPage';
import { PublicSimulationPage } from '@/pages/public/PublicSimulationPage';

import { UnauthorizedPage } from '@/pages/common/UnauthorizedPage';
import { NotFoundPage } from '@/pages/common/NotFoundPage';

export const AppRoutes = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
    </Route>

    <Route element={<PublicLayout />}>
      <Route path="/" element={<PublicRankingPage />} />
      <Route path="/ranking" element={<PublicRankingPage />} />
      <Route path="/simulation" element={<PublicSimulationPage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute allowedRoles={['IT_Admin','admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/criteria" element={<CriteriaManagement />} />
        </Route>
      </Route>
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute allowedRoles={['Verificator']} />}>
        <Route element={<VerificatorLayout />}>
          <Route path="/verificator/dashboard" element={<VerificatorDashboard />} />
          <Route path="/verificator/ahp-input" element={<AHPInputPage />} />
          <Route path="/verificator/ahp-result" element={<AHPResultPage />} />
        </Route>
      </Route>
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute allowedRoles={['Data_Admin']} />}>
        <Route element={<OperatorLayout />}>
          <Route path="/operator/dashboard" element={<OperatorDashboard />} />
          <Route path="/operator/alternatives" element={<AlternativeManagement />} />
          <Route path="/operator/decision-matrix" element={<DecisionMatrixPage />} />
          <Route path="/operator/marcos-result" element={<MARCOSResultPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);