import {Routes, Route} from 'react-router-dom';
import {Home} from './pages/Home';
import {Roles} from './pages/Roles';
import {GameSetupPage} from './pages/GameSetup';
import {GameFacilitatorPage} from './pages/GameFacilitator';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/roles" element={<Roles />} />
      <Route path="/games/new" element={<GameSetupPage />} />
      <Route path="/games/:gameId" element={<GameFacilitatorPage />} />
    </Routes>
  );
}

