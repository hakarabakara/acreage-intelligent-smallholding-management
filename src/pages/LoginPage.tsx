import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Loader2, Lock, Mail, ArrowRight, AlertCircle, User, Building } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api-client';
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuth((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Register State
  const [regFarmName, setRegFarmName] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  // Get the redirect path from location state, or default to /
  const from = (location.state as any)?.from?.pathname || '/';
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Normalize email to lowercase and trim before sending
      const normalizedEmail = email.toLowerCase().trim();
      await login(normalizedEmail, password);
      toast.success('Welcome back to Acreage');
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      let errorMessage = 'Login failed. Please try again.';
      // Extract error message from API response if available
      if (err instanceof Error) {
          errorMessage = err.message;
      }
      // User-friendly mapping
      if (errorMessage.includes('User not found')) {
          errorMessage = 'Account not found. Please check your email or register.';
      } else if (errorMessage.includes('Incorrect password')) {
          errorMessage = 'Incorrect password. Please try again.';
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFarmName || !regName || !regEmail || !regPassword) {
      toast.error('All fields are required');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          farmName: regFarmName,
          name: regName,
          email: regEmail.toLowerCase().trim(),
          password: regPassword
        })
      });
      // Auto-login after registration
      await login(regEmail.toLowerCase().trim(), regPassword);
      toast.success('Farm created successfully!');
      navigate('/');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  const fillDemo = () => {
    setEmail('john@farm.com');
    setPassword('password');
  };
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-60"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/20 mb-4">
            <Sprout className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Acreage</h1>
          <p className="text-emerald-100/80 mt-2 text-lg">Intelligent Farm Management</p>
        </div>
        <Card className="border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl text-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="space-y-1 pb-2">
              <TabsList className="grid w-full grid-cols-2 bg-black/20">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register Farm</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-emerald-100">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-emerald-200/50" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-emerald-100">Password</Label>
                      <a href="#" className="text-xs text-emerald-300 hover:text-emerald-200">Forgot password?</a>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-emerald-200/50" />
                      <Input
                        id="password"
                        type="password"
                        className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-none h-11 mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Sign In <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="farmName" className="text-emerald-100">Farm Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-emerald-200/50" />
                      <Input
                        id="farmName"
                        placeholder="Green Valley Farm"
                        className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50"
                        value={regFarmName}
                        onChange={(e) => setRegFarmName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regName" className="text-emerald-100">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-emerald-200/50" />
                      <Input
                        id="regName"
                        placeholder="John Doe"
                        className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regEmail" className="text-emerald-100">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-emerald-200/50" />
                      <Input
                        id="regEmail"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regPassword" className="text-emerald-100">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-emerald-200/50" />
                      <Input
                        id="regPassword"
                        type="password"
                        className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-none h-11 mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Create Farm <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 text-center text-sm text-emerald-100/60">
              {activeTab === 'login' && (
                <>
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-transparent px-2 text-emerald-100/40">Or</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fillDemo} className="text-xs text-emerald-200/60 hover:text-white hover:bg-white/10">
                    Fill Demo Credentials
                  </Button>
                </>
              )}
            </CardFooter>
          </Tabs>
        </Card>
        <p className="text-center text-emerald-100/40 text-xs mt-8">
          &copy; {new Date().getFullYear()} Acreage Inc. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}