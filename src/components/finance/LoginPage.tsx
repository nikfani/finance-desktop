'use client';

import { useState } from 'react';
import { useFinanceStore } from '@/store/finance-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, LogIn, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { login, register } = useFinanceStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const result = isLogin 
      ? login(username, password)
      : register(username, password);
    
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    setIsLoading(false);
    
    if (result.success) {
      setUsername('');
      setPassword('');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setMessage(null);
    setUsername('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <Card className="border-0 shadow-xl rounded-3xl max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[var(--accent-warm)] to-[var(--accent-coral)] flex items-center justify-center shadow-lg mb-4">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[var(--text-primary)]">
            {isLogin ? 'Вход в аккаунт' : 'Регистрация'}
          </CardTitle>
          <p className="text-[var(--text-secondary)] mt-2">
            {isLogin 
              ? 'Войдите в свой аккаунт для доступа к данным'
              : 'Создайте новый аккаунт для начала работы'
            }
          </p>
        </CardHeader>
        
        <CardContent className="p-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${
                message.type === 'error' 
                  ? 'bg-[var(--danger-rose)]/20' 
                  : 'bg-[var(--success-green)]/20'
              }`}>
                {message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-[var(--danger-rose)]" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-[var(--success-green)]" />
                )}
                <p className={`font-medium ${
                  message.type === 'error' 
                    ? 'text-[var(--danger-rose)]' 
                    : 'text-[var(--success-green)]'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[var(--text-primary)] font-medium">
                Имя пользователя
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                className="rounded-xl h-12 border-[var(--border)] focus:border-[var(--accent-warm)]"
                required
                minLength={3}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--text-primary)] font-medium">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="rounded-xl h-12 border-[var(--border)] focus:border-[var(--accent-warm)] pr-12"
                  required
                  minLength={4}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Пароль чувствителен к регистру.</p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--accent-warm)] to-[var(--accent-coral)] hover:opacity-90 text-white font-medium shadow-md"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Загрузка...
                </span>
              ) : isLogin ? (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Войти
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Зарегистрироваться
                </span>
              )}
            </Button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-[var(--text-secondary)]">
              {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              <button
                onClick={switchMode}
                className="ml-2 text-[var(--accent-coral)] font-medium hover:underline"
              >
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
