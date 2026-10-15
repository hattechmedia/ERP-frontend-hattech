import AppRoutes from "./router/AppRoutes";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'premium-toast',
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#1e293b',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 74, 173, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <AppRoutes />
    </div>
  );
}
