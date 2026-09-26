import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { InventoryProvider } from './context/InventoryContext';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InventoryProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </InventoryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
