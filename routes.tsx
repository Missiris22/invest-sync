import { RouteObject } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MarketAnalysis from './components/MarketAnalysis';
import Login from './components/Login';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/protected/ProtectedRoute';

// Define route configuration as a TypeScript array
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'analysis',
        element: <MarketAnalysis />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
];

// Import Navigate here to fix the missing import in the routes array
import { Navigate } from 'react-router-dom';