import {Routes, Route} from 'react-router-dom';
import {HomePage} from './pages/HomePage';
import {RolesPage} from './pages/RolesPage';
import {GameSetupPage} from './pages/GameSetup';
import {GameFacilitatorPage} from './pages/GameFacilitator';
import {RoleBuilderPage} from './pages/RoleBuilder';
import {WakeOrderResolutionPage} from './pages/WakeOrderResolution';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/roles/new" element={<RoleBuilderPage />} />
      <Route path="/roles" element={<RolesPage />} />
      <Route path="/games/new" element={<GameSetupPage />} />
      <Route path="/games/new/wake-order" element={<WakeOrderResolutionPage />} />
      <Route path="/games/:gameId" element={<GameFacilitatorPage />} />
    </Routes>
  );
}

