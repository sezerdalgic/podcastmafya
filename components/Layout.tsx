import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'New Episode', path: '/create', icon: '🎙️' },
    { name: 'Episodes', path: '/episodes', icon: 'd' },
    { name: 'Characters', path: '/characters', icon: '🤖' },
    { name: 'Programs', path: '/programs', icon: '📻' },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            AI Podcast Network
          </h1>
          <p className="text-xs text-slate-500 mt-1">Autonomous Media System</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                location.pathname === item.path
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <span className="text-xl">
                {item.icon === 'd' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                ) : item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        
        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
           {user && (
             <Link 
               to="/settings"
               className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-slate-800 transition-colors group cursor-pointer"
               title="Go to Settings"
             >
               <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full border border-slate-600 group-hover:border-indigo-500 transition-colors" />
               <div className="min-w-0">
                 <div className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{user.name}</div>
                 <div className="text-[10px] text-indigo-400 font-bold tracking-wider">{user.role.replace('_', ' ')}</div>
               </div>
             </Link>
           )}
           <button 
             onClick={logout}
             className="w-full flex items-center justify-center gap-2 p-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
           >
             <LogOut size={14} /> Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-900">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};