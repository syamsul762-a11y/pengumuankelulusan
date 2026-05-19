import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn, Loader2, AlertCircle, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'motion/react';
import { auth } from '@/lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { toast } from 'sonner';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && (user.email === "syamsul762@guru.sd.belajar.id" || user.email === "admin@siks.com")) {
        navigate('/admin/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user.email === "syamsul762@guru.sd.belajar.id" || user.email === "admin@siks.com") {
        toast.success('Login Berhasil', {
          description: `Selamat datang, ${user.displayName || 'Admin'}`
        });
        navigate('/admin/dashboard');
      } else {
        await auth.signOut();
        setError('Akses Ditolak. Email Anda tidak terdaftar sebagai administrator.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Gagal login. Pastikan koneksi internet stabil.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (username === 'admin' && password === 'admin123') {
      const adminEmail = 'admin@siks.com';
      const adminPass = 'admin123';
      
      try {
        // Try sign in
        await signInWithEmailAndPassword(auth, adminEmail, adminPass);
        toast.success('Login Berhasil', {
          description: 'Selamat datang, Administrator'
        });
        navigate('/admin/dashboard');
      } catch (err: any) {
        console.log("Manual auth error:", err.code);
        // If user not found, try to create it (simple auto-provisioning for this use case)
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
           try {
             await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
             toast.success('Account Created & Logged In', {
               description: 'Akun administrator baru telah dibuat.'
             });
             navigate('/admin/dashboard');
           } catch (createErr: any) {
             console.error(createErr);
             setError('Gagal membuat akun admin atau password salah.');
           }
        } else {
           setError('Gagal login manual. Periksa koneksi atau kredensial.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Username atau password salah.');
      toast.error('Login Gagal');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-heading font-black">Admin SIKS</h1>
          <p className="text-sm text-muted-foreground">Sistem Informasi Kelulusan Sekolah</p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl text-center">Akses Administrator</CardTitle>
            <CardDescription className="text-center font-medium">Pilih metode masuk yang anda inginkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="manual" className="gap-2">
                  <Lock className="h-4 w-4" /> Manual
                </TabsTrigger>
                <TabsTrigger value="google" className="gap-2">
                  <LogIn className="h-4 w-4" /> Google
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username text-sm ml-1">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="username"
                        placeholder="admin" 
                        className="pl-10"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password text-sm ml-1">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password"
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-bold" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Masuk'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="google" className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-6">
                    Gunakan akun Google yang telah didaftarkan dalam sistem.
                  </p>
                  <Button 
                    onClick={handleGoogleLogin} 
                    className="w-full h-12 font-bold gap-2" 
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Google Account
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <p className="text-[10px] text-center text-muted-foreground italic mt-4">
              Akses terbatas hanya untuk administrator resmi sekolah.
            </p>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} SIKS Admin Portal. 
          <br />Hubungi tim IT sekolah jika Anda mengalami kendala login.
        </p>
      </motion.div>
    </div>
  );
}

