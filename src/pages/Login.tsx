import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, isUsingMock } from '../services/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else if (user.role === 'mahasantri') {
        navigate('/dashboard-mahasantri', { replace: true });
      } else {
        navigate('/dashboard-pengajar', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('login', { email, password });
      login(response.data.user);
      
      toast.success(`Ahlan wa sahlan, ${response.data.user.nama || 'User'}!`);
      
      if (response.data.user.role === 'admin') {
        navigate('/dashboard');
      } else if (response.data.user.role === 'mahasantri') {
        navigate('/dashboard-mahasantri');
      } else {
        navigate('/dashboard-pengajar');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-800 bg-slate-50">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-slate-600">
              Sistem Manajemen Absensi Mahasantri
            </p>
          </div>

          <div className="mt-8">
             {isUsingMock && (
              <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  <b className="text-amber-900 block mb-1">💡 Demo Mode / Mockup Aktif</b>
                  Login Admin: <code className="bg-amber-100 px-1 rounded">admin@admin.com</code><br/>
                  Login Pengajar: <code className="bg-amber-100 px-1 rounded">ahmad@pengajar.com</code><br/>
                  Login Mahasantri: <code className="bg-amber-100 px-1 rounded">fulan@mahasantri.com</code> atau <code className="bg-amber-150 px-1 rounded">fulanah@mahasantri.com</code><br/>
                  Password: <span className="italic">bebas (sembarang kata)</span>
                </p>
                <div className="mt-2 text-xs">
                  <button onClick={() => navigate('/setup')} className="text-emerald-700 underline font-semibold hover:text-emerald-800">Baca Panduan Setup G-Sheets</button>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    placeholder="nama@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-emerald-500 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-emerald-400"
                >
                  {loading ? 'Processing...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block bg-emerald-900 border-l border-emerald-800">
        <div className="absolute inset-0 h-full w-full object-cover p-12 flex flex-col justify-center items-center text-center text-white">
          <h1 className="text-5xl font-bold mb-4 font-sans tracking-tight">Ma'had Aly Al-Furqon Magelang</h1>
          <p className="text-emerald-100 text-lg max-w-lg">Platform digital absensi perkuliahan untuk memudahkan monitoring kehadiran mahasantri dan pengajar secara real-time.</p>
        </div>
      </div>
    </div>
  );
}
