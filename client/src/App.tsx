import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { SkeletonCard } from './components/ui/Skeleton';
import { Login } from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewReview from './pages/NewReview';
import ReviewDetail from './pages/ReviewDetail';
import { NotFound, Forbidden } from './pages/NotFound';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function Loading() {
  return (
    <div style={{ padding:40, display:'flex', flexDirection:'column', gap:16, maxWidth:800, margin:'0 auto' }}>
      {Array.from({length:3}).map((_,i)=><SkeletonCard key={i}/>)}
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/review/new" element={<RequireAuth><NewReview /></RequireAuth>} />
        <Route path="/review/:id" element={<RequireAuth><ReviewDetail /></RequireAuth>} />
        <Route path="/admin" element={
          <RequireAuth>
            <Suspense fallback={<Loading />}>
              <AdminDashboard />
            </Suspense>
          </RequireAuth>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
