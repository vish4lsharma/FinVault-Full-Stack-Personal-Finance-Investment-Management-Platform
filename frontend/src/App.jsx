import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import Cards from './pages/Cards';

function App() {
  const { token } = useSelector((state) => state.auth);

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Login />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/activity" element={token ? <Activity /> : <Navigate to="/" />} />
        <Route path="/analytics" element={token ? <Analytics /> : <Navigate to="/" />} />
        <Route path="/cards" element={token ? <Cards /> : <Navigate to="/" />} />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
