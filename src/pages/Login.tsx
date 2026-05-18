import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'motion/react';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "syamsul762@guru.sd.belajar.id") {
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
      
      if (user.email === "syamsul762@guru.sd.belajar.id") {
        toast.success('Login Berhasil', {
          description: `Selamat datang, ${user.displayName}`
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
            <CardTitle className="text-center">Halaman Login Admin</CardTitle>
            <CardDescription className="text-center">Silakan masuk menggunakan akun Google administrator yang terdaftar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button 
                onClick={handleGoogleLogin} 
                className="w-full h-12 font-bold gap-2" 
                disabled={isLoading}
                variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Masuk dengan Google
                </>
              )}
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground italic">
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

