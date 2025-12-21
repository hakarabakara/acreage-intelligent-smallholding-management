import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout, Loader2, Lock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuth((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('john@acreage.app');
  const [password, setPassword] = useState('password');
  // Get the redirect path from location state, or default to /
  const from = (location.state as any)?.from?.pathname || '/';
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setIsLoading(true);
    try {
      await login(email);
      toast.success('Welcome back to Acreage');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
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
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center">Sign in to your account</CardTitle>
            <CardDescription className="text-center text-emerald-100/60">
              Enter your credentials to access Mission Control
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center text-sm text-emerald-100/60">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-emerald-100/40">Demo Access</span>
              </div>
            </div>
            <p>Use <strong>john@acreage.app</strong> / <strong>password</strong></p>
          </CardFooter>
        </Card>
        <p className="text-center text-emerald-100/40 text-xs mt-8">
          &copy; {new Date().getFullYear()} Acreage Inc. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}