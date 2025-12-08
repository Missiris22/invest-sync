import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Smartphone, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { login, currentUser } = useApp();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && name) {
      login(phone, name);
      // The useEffect will handle the navigation once currentUser is set
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white">InvestSync</h1>
          <p className="text-slate-400 mt-2">共享持仓，AI 辅助分析趋势</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              placeholder="+86 1XX XXXX XXXX"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">昵称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              placeholder="股神"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <LogIn className="w-5 h-5" />
            登录
          </button>
        </form>
        <p className="text-xs text-center text-slate-500 mt-6">
          演示版本：数据仅存储在本地设备。
        </p>
      </div>
    </div>
  );
};

export default Login;