import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, PlusCircle, BarChart2, LogOut, CandlestickChart } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/trades', label: 'Trades', icon: <List size={20} /> },
    { path: '/add-trade', label: 'Add Trade', icon: <PlusCircle size={20} /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
    { path: '/chart', label: 'Chart', icon: <CandlestickChart size={20} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '250px', backgroundColor: 'var(--bg-card)', padding: '2rem 1rem', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '2rem', padding: '0 1rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '-0.5px' }}>Trade Analysis</h1>
        </div>
        
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                  <Link
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: isActive ? 'white' : 'var(--text-muted)',
                      backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                      transition: 'all 0.2s ease',
                      fontWeight: isActive ? 500 : 400
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1rem', padding: '0 1rem' }}>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Logged in as</span><br/>
            <strong>{user?.name}</strong>
          </div>
          <button onClick={logout} className="btn" style={{ width: '100%', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger-light)' }}>
            <LogOut size={16} style={{ marginRight: '0.5rem' }}/> Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', backgroundColor: 'var(--bg-color)' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
