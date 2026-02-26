import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryManager from './pages/admin/CategoryManager';
import RecipeDetail from './pages/RecipeDetail';

function App() {
  const isAuthenticated = !!localStorage.getItem('userProfile');

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} 
          />

          <Route 
            path="/resep/:id" 
            element={isAuthenticated ? <RecipeDetail /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/admin" 
            element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/admin/kategori" 
            element={isAuthenticated ? <CategoryManager /> : <Navigate to="/login" replace />} 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;