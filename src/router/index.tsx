import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { HealthPage } from '../modules/health/HealthPage';
import { TrainingLogPage } from '../modules/training/TrainingLogPage';
import { SettingsPage } from '../modules/settings/SettingsPage';

export const AppRouter = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/training" element={<TrainingLogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};
