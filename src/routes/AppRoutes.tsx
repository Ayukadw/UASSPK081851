import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

import { AuthLayout } from '@/layouts/AuthLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { VerificatorLayout } from '@/layouts/VerificatorLayout';
import { OperatorLayout } from '@/layouts/OperatorLayout';
import { PublicLayout } from '@/layouts/PublicLayout';

import { LoginPage } from '@/pages/auth/LoginPage';

import { KelolaUser } from '@/pages/admin/KelolaUser';
import { KelolaKriteria } from '@/pages/admin/KelolaKriteria';
import type { UserRole } from '@/types';

import { PembobotanKriteria } from '@/pages/verificator/PembobotanKriteria';

import { InputDataAlternatif } from '@/pages/operator/InputDataAlternatif';
import { KelolaAlternatif } from '@/pages/operator/KelolaAlternatif';

import { InputData } from '@/pages/public/InputData';
import { MatrixKeputusan } from '@/pages/public/MatrixKeputusan';
import { SolusiIdealAntiIdeal } from '@/pages/public/SolusiIdealAntiIdeal';
import { NormalisasiMatrixKeputusan } from '@/pages/public/NormalisasiMatrixKeputusan';
import { NormalisasiTerbobot } from '@/pages/public/NormalisasiTerbobot';
import { TingkatUtilitasAlternatif } from '@/pages/public/TingkatUtilitasAlternatif';
import { FungsiUtilitas } from '@/pages/public/FungsiUtilitas';

import { UnauthorizedPage } from '@/pages/common/Unauthorizedpage';
import { NotFoundPage } from '@/pages/common/NotFoundPage';

export const AppRoutes = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
    </Route>

    <Route element={<PublicLayout />}>
      <Route path="/" element={<InputData />} />
      <Route path="/ranking" element={<InputData />} />
      <Route path="/ranking/matrix-keputusan" element={<MatrixKeputusan />} />
      <Route path="/ranking/solusi-ideal-anti-ideal" element={<SolusiIdealAntiIdeal />} />
      <Route path="/ranking/normalisasi-matrix-keputusan" element={<NormalisasiMatrixKeputusan />} />
      <Route path="/ranking/normalisasi-terbobot" element={<NormalisasiTerbobot />} />
      <Route path="/ranking/tingkat-utilitas-alternatif" element={<TingkatUtilitasAlternatif />} />
      <Route path="/ranking/fungsi-utilitas" element={<FungsiUtilitas />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute allowedRoles={['IT_Admin', 'admin'] as UserRole[]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<KelolaUser />} />
          <Route path="/admin/users" element={<KelolaUser />} />
          <Route path="/admin/criteria" element={<KelolaKriteria />} />
        </Route>
      </Route>
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute allowedRoles={['Verificator']} />}>
        <Route element={<VerificatorLayout />}>
          <Route path="/verificator/ahp-input" element={<PembobotanKriteria />} />
        </Route>
      </Route>
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<RoleRoute allowedRoles={['Data_Admin']} />}>
        <Route element={<OperatorLayout />}>
          <Route path="/operator/dashboard" element={<InputDataAlternatif />} />
          <Route path="/operator/alternatives" element={<KelolaAlternatif />} />
        </Route>
      </Route>
    </Route>

    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);