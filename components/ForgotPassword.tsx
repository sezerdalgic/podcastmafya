import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Mail } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { resetPasswordRequest, verifyOtpAndResetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await resetPasswordRequest(email);
    if (res.success) {
      setStep(2);
      setSuccess(res.message);
    } else {
      setError(res.message);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await verifyOtpAndResetPassword(email, otp, newPassword);
    if (res.success) {
      alert("Password Reset Successfully!");
      navigate('/login');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <Link to="/login" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-6">
          <ArrowLeft size={16} /> Back to Login
        </Link>
        
        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <p className="text-slate-400 text-sm mb-4">Enter your email address to receive a verification code.</p>
            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded text-sm border border-red-500/20">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                placeholder="you@company.com"
              />
            </div>
            
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2">
              Send Code <Mail size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="bg-green-500/10 text-green-400 p-3 rounded text-sm border border-green-500/20 flex items-center gap-2">
               <CheckCircle size={16} /> Code sent to {email}
            </div>
            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded text-sm border border-red-500/20">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Verification Code</label>
              <input
                type="text" required
                value={otp} onChange={e => setOtp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none tracking-widest text-center text-lg font-mono"
                placeholder="123456"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <input
                type="password" required
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                placeholder="New strong password"
              />
            </div>

            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2">
              Reset Password <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};