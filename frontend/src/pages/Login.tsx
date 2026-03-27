import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();
    if (!trimmedUser || !trimmedPass) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const result = await authApi.login(trimmedUser, trimmedPass);
      const ok = login(trimmedUser, trimmedPass, result.token, result.user);
      if (ok) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
      return;
    } catch (error) {
      const fallback = login(trimmedUser, trimmedPass);
      if (fallback) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--gradient-hero)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center px-12 text-primary-foreground">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-accent flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-accent-foreground" />
            </div>
            <h1 className="text-4xl font-bold font-display">Sadhana Memorial</h1>
          </div>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            A complete school management solution. Manage students, fees, hall tickets, report cards, and more — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {['Student Records', 'Fee Tracking', 'Hall Tickets', 'Report Cards'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-modal)] p-8 animate-fade-in">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold font-display text-foreground">Sadhana Memorial</h2>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground">Welcome back</h3>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  maxLength={100}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>


        </div>
      </div>
    </div>
  );
}
