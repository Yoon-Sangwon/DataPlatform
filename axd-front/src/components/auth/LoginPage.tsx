import { useState } from 'react';
import { Database, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Data Portal</h1>
          <p className="text-slate-600 dark:text-slate-400">데이터 자산 관리 및 분석 플랫폼</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 text-center">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                placeholder="********"
                required
                minLength={4}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors mt-6"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                <LogIn className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            {mode === 'login' ? (
              <>
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  회원가입
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  로그인
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">데모 계정 (클릭하여 자동 입력)</p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@example.com');
                setPassword('1111');
                setMode('login');
              }}
              className="block w-full text-left px-3 py-2 text-sm rounded bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
            >
              <span className="font-medium text-slate-900 dark:text-white">관리자</span>
              <span className="text-slate-500 dark:text-slate-400"> - admin@example.com</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('adv@example.com');
                setPassword('1111');
                setMode('login');
              }}
              className="block w-full text-left px-3 py-2 text-sm rounded bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
            >
              <span className="font-medium text-slate-900 dark:text-white">데이터 분석가</span>
              <span className="text-slate-500 dark:text-slate-400"> - adv@example.com</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('user@example.com');
                setPassword('1111');
                setMode('login');
              }}
              className="block w-full text-left px-3 py-2 text-sm rounded bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
            >
              <span className="font-medium text-slate-900 dark:text-white">일반 사용자</span>
              <span className="text-slate-500 dark:text-slate-400"> - user@example.com</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">모든 계정 비밀번호: 1111</p>
        </div>
      </div>
    </div>
  );
}
