import {Layout} from './components/Layout';
import {AppRoutes} from './routes';
import {RepositoryProvider, useRepositories} from './context/repository_context';
import './styles/App.css';

export function App() {
  return (
    <RepositoryProvider>
      <Layout>
        <CatalogGate>
          <AppRoutes />
        </CatalogGate>
      </Layout>
    </RepositoryProvider>
  );
}

interface CatalogGateProps {
  readonly children: React.ReactNode;
}

function CatalogGate({children}: CatalogGateProps) {
  const {repositories, loading, error} = useRepositories();

  if (loading) {
    return <div role="status">Loading local catalog...</div>;
  }

  if (error !== null || repositories === null) {
    return (
      <div role="alert">
        Failed to load local catalog: {error ?? 'Repositories are unavailable'}
      </div>
    );
  }

  return <>{children}</>;
}
