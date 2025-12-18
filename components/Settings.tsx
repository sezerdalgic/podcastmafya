import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, User as UserIcon, Lock, Mail, Trash2, Plus, RefreshCw, Pencil, Check, X } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, usersList, changePassword, inviteUser, updateUserRole, deleteUser, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');

  // Profile Form State
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });
  
  // Name Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  // Team Form State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'EDITOR' as UserRole });

  // --- Handlers ---

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      setPassMsg({ text: "New passwords don't match", type: 'error' });
      return;
    }
    const res = await changePassword(passData.old, passData.new);
    if (res.success) {
      setPassMsg({ text: res.message, type: 'success' });
      setPassData({ old: '', new: '', confirm: '' });
    } else {
      setPassMsg({ text: res.message, type: 'error' });
    }
  };

  const handleNameUpdate = async () => {
    if (!editName.trim()) return;
    try {
      await updateUserProfile({ name: editName });
      setIsEditingName(false);
    } catch (e) {
      console.error("Failed to update name", e);
    }
  };

  const startEditingName = () => {
    setEditName(user?.name || '');
    setIsEditingName(true);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteUser(inviteData.email, inviteData.name, inviteData.role);
      setIsInviteModalOpen(false);
      setInviteData({ email: '', name: '', role: 'EDITOR' });
      alert("User invited successfully!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'profile' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          My Profile
        </button>
        {user?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'team' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Team Management
          </button>
        )}
      </div>

      {/* --- Profile Tab --- */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl space-y-8">
          {/* Profile Card */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center gap-6">
            <img src={user?.avatar} alt="Me" className="w-20 h-20 rounded-full border-4 border-slate-700" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white font-bold text-lg outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button onClick={handleNameUpdate} className="p-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/40">
                      <Check size={18} />
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="p-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                    <button 
                      onClick={startEditingName}
                      className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                      title="Edit Name"
                    >
                      <Pencil size={14} />
                    </button>
                  </>
                )}
              </div>
              <p className="text-slate-400">{user?.email}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                {user?.role.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock size={18} className="text-slate-400" /> Change Password
            </h3>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passMsg.text && (
                <div className={`text-sm p-3 rounded ${passMsg.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                  {passMsg.text}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                <input 
                  type="password" required 
                  value={passData.old} onChange={e => setPassData({...passData, old: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                  <input 
                    type="password" required 
                    value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New</label>
                  <input 
                    type="password" required 
                    value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Team Tab --- */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-white">Authorized Users</h3>
             <button 
               onClick={() => setIsInviteModalOpen(true)}
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
             >
               <Plus size={16} /> Invite User
             </button>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700 text-xs uppercase text-slate-400">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} className="w-8 h-8 rounded-full" alt="avatar" />
                        <div>
                          <div className="text-white font-medium text-sm">{u.name}</div>
                          <div className="text-slate-500 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {u.id === user?.id ? (
                        <span className="text-xs font-mono text-slate-400">{u.role}</span>
                      ) : (
                        <select 
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                          className="bg-slate-900 border border-slate-700 text-xs rounded p-1 text-slate-300 outline-none"
                        >
                          <option value="EDITOR">EDITOR</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER ADMIN</option>
                        </select>
                      )}
                    </td>
                    <td className="p-4">
                      {u.isInvited ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] uppercase font-bold border border-amber-500/30">Pending Invite</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold border border-emerald-500/30">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                       {u.id !== user?.id && (
                         <button 
                           onClick={() => { if(window.confirm('Delete user?')) deleteUser(u.id); }}
                           className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input required type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                  value={inviteData.name} onChange={e => setInviteData({...inviteData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input required type="email" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                  value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                  value={inviteData.role} onChange={e => setInviteData({...inviteData, role: e.target.value as UserRole})}
                >
                  <option value="EDITOR">Editor (Can create episodes)</option>
                  <option value="ADMIN">Admin (Manage content)</option>
                  <option value="SUPER_ADMIN">Super Admin (Manage users)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1 py-2 text-slate-400 hover:bg-slate-700 rounded">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};