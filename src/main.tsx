import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { RequireAuth } from '@/components/layout/RequireAuth';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage'
import { FieldsPage } from '@/pages/FieldsPage'
import { TasksPage } from '@/pages/TasksPage'
import { CropsPage } from '@/pages/CropsPage'
import { LivestockPage } from '@/pages/LivestockPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { FinancesPage } from '@/pages/FinancesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { DemoPage } from '@/pages/DemoPage'
import { SalesPage } from '@/pages/SalesPage'
import { CompliancePage } from '@/pages/CompliancePage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { TeamPage } from '@/pages/TeamPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { PlanningPage } from '@/pages/PlanningPage'
// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/",
    element: <RequireAuth><HomePage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/calendar",
    element: <RequireAuth><CalendarPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/fields",
    element: <RequireAuth><FieldsPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/tasks",
    element: <RequireAuth><TasksPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/crops",
    element: <RequireAuth><CropsPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/livestock",
    element: <RequireAuth><LivestockPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/inventory",
    element: <RequireAuth><InventoryPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/finances",
    element: <RequireAuth><FinancesPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/sales",
    element: <RequireAuth><SalesPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/compliance",
    element: <RequireAuth><CompliancePage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/analytics",
    element: <RequireAuth><AnalyticsPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/team",
    element: <RequireAuth><TeamPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/contacts",
    element: <RequireAuth><ContactsPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/resources",
    element: <RequireAuth><ResourcesPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/planning",
    element: <RequireAuth><PlanningPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/settings",
    element: <RequireAuth><SettingsPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/demo",
    element: <RequireAuth><DemoPage /></RequireAuth>,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  }
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)