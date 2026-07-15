import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { WalletsPage } from './pages/WalletsPage';
import { WalletDetailPage } from './pages/WalletDetailPage';
import { DailyReportPage } from './pages/DailyReportPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="wallets/:id" element={<WalletDetailPage />} />
        <Route path="reports/daily" element={<DailyReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
