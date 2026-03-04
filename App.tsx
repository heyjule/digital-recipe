import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryManager from './pages/admin/CategoryManager';
import RecipeDetail from './pages/RecipeDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
       <Routes>
  <Route path="/login" element={<Login />} />
  
  {/* Halaman Galeri (Bisa dibuka Admin & Crew) */}
  <Route path="/" element={
    <ProtectedRoute allowedRoles={['admin', 'crew']}>
      <Home />
    </ProtectedRoute>
  } />

  {/* Halaman Dashboard (HANYA UNTUK ADMIN) */}
  <Route path="/admin" element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  } />

          <Route 
            path="/resep/:id" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'crew']}>
                <RecipeDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Akses Khusus Admin Office */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/kategori" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CategoryManager />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;