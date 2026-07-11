'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  width: string;
} {
  if (!password) return { score: 0, label: '', color: '', width: '0%' };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'خیلی ضعیف', color: 'bg-red-500', width: '20%' },
    { label: 'ضعیف', color: 'bg-orange-500', width: '40%' },
    { label: 'متوسط', color: 'bg-yellow-500', width: '60%' },
    { label: 'قوی', color: 'bg-emerald-400', width: '80%' },
    { label: 'خیلی قوی', color: 'bg-emerald-600', width: '100%' },
  ];

  const idx = Math.min(score, levels.length) - 1;
  if (idx < 0) return { score: 0, label: '', color: '', width: '0%' };

  return { score, ...levels[idx] };
}

export function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const passwordStrength = getPasswordStrength(regPassword);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail.trim()) {
      toast.error('لطفاً ایمیل خود را وارد کنید');
      return;
    }
    if (!loginPassword) {
      toast.error('لطفاً رمز عبور خود را وارد کنید');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: loginEmail.toLowerCase().trim(),
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        toast.error('ایمیل یا رمز عبور اشتباه است');
      } else {
        window.location.reload();
      }
    } catch {
      toast.error('خطا در ورود به حساب کاربری');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim()) {
      toast.error('لطفاً نام خود را وارد کنید');
      return;
    }
    if (!regEmail.trim()) {
      toast.error('لطفاً ایمیل خود را وارد کنید');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.toLowerCase().trim(),
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'خطا در ثبت‌نام');
        return;
      }

      toast.success('ثبت‌نام با موفقیت انجام شد!');

      const loginResult = await signIn('credentials', {
        email: regEmail.toLowerCase().trim(),
        password: regPassword,
        redirect: false,
      });

      if (loginResult?.error) {
        toast.error('ثبت‌نام موفق بود اما خطا در ورود خودکار. لطفاً وارد شوید.');
        setActiveTab('login');
      } else {
        window.location.reload();
      }
    } catch {
      toast.error('خطا در ثبت‌نام');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* Branding Side - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute top-20 left-20 h-3 w-3 rounded-full bg-emerald-300/40" />
        <div className="absolute top-40 right-40 h-2 w-2 rounded-full bg-teal-300/40" />
        <div className="absolute bottom-40 left-1/4 h-4 w-4 rounded-full bg-emerald-200/30" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
                <span className="text-4xl">✦</span>
              </div>
            </div>
            <h1 className="mb-3 text-5xl font-bold tracking-tight">
              لایف‌او‌اس
            </h1>
            <p className="mb-8 text-2xl font-light text-emerald-100">
              سیستم عامل زندگی شما
            </p>
            <p className="max-w-md mx-auto text-emerald-100/80 text-base leading-8">
              تمام ابزارهای مورد نیاز برای مدیریت وظایف، پروژه‌ها، عادت‌ها و اهداف خود را در یک مکان داشته باشید.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-6"
          >
            {[
              { icon: '📋', label: 'مدیریت وظایف' },
              { icon: '📊', label: 'ردیابی عادت‌ها' },
              { icon: '🎯', label: 'پیگیری اهداف' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="flex flex-col items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm p-4"
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-sm text-emerald-100">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex w-full items-center justify-center bg-background px-4 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/10">
              <span className="text-3xl">✦</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">لایف‌او‌اس</h1>
            <p className="text-sm text-muted-foreground">سیستم عامل زندگی شما</p>
          </div>

          <Card className="border-0 shadow-xl shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4 text-center">
              <h2 className="text-2xl font-bold text-foreground">
                {activeTab === 'login' ? 'ورود به حساب کاربری' : 'ایجاد حساب جدید'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'login'
                  ? 'خوش آمدید! لطفاً وارد شوید.'
                  : 'یک حساب جدید برای شروع ایجاد کنید.'}
              </p>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-6 grid w-full grid-cols-2">
                  <TabsTrigger value="login">ورود</TabsTrigger>
                  <TabsTrigger value="register">ثبت‌نام</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  {activeTab === 'login' ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.25 }}
                      onSubmit={handleLogin}
                      className="space-y-5"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="login-email">ایمیل</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="email@example.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pr-10 pl-4"
                            autoComplete="email"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">رمز عبور</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="رمز عبور خود را وارد کنید"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pr-10 pl-10"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'ورود'
                        )}
                      </Button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      onSubmit={handleRegister}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="reg-name">نام</Label>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reg-name"
                            type="text"
                            placeholder="نام شما"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="pr-10"
                            autoComplete="name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-email">ایمیل</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="email@example.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="pr-10 pl-4"
                            autoComplete="email"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-password">رمز عبور</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="حداقل ۶ کاراکتر"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="pr-10 pl-10"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {regPassword.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-1.5"
                          >
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <motion.div
                                className={`h-full rounded-full ${passwordStrength.color}`}
                                initial={{ width: 0 }}
                                animate={{ width: passwordStrength.width }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground text-left" dir="ltr">
                              {passwordStrength.label}
                            </p>
                          </motion.div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-confirm-password">تکرار رمز عبور</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="reg-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="تکرار رمز عبور"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="pr-10 pl-10"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {regConfirmPassword.length > 0 && regPassword !== regConfirmPassword && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-red-500"
                          >
                            رمز عبور مطابقت ندارد
                          </motion.p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'ثبت‌نام'
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </Tabs>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            با ورود یا ثبت‌نام، شما شرایط استفاده لایف‌او‌اس را می‌پذیرید.
          </p>
        </motion.div>
      </div>
    </div>
  );
}