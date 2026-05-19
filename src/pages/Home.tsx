import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, CheckCircle2, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Countdown } from '@/components/Countdown';
import { motion } from 'motion/react';
import { settingsService } from '@/services/settingsService';
import { AppSettings } from '@/types';

export default function Home() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        if (data) setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const announcementDateTime = settings?.announcementDate ? new Date(settings.announcementDate) : new Date();
  const isReleased = settings?.isLive && new Date() >= announcementDateTime;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center mb-6"
          >
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo Sekolah" className="h-24 w-24 object-contain mb-4 drop-shadow-xl" />
            ) : (
              <GraduationCap className="h-16 w-16 text-primary mb-4" />
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Tahun Ajaran 2025/2026
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-7xl font-heading font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
          >
            Sistem Informasi <br className="hidden md:block" />
            <span className="text-primary">Kelulusan Siswa</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Selamat datang di portal resmi pengumuman kelulusan {settings?.schoolName || 'Sekolah'}. 
            {isReleased 
              ? 'Silakan cek status kelulusan Anda dengan memasukkan nomor NISN.' 
              : 'Hasil kelulusan akan diumumkan sesuai dengan waktu yang telah ditentukan.'}
          </motion.p>

          {!isReleased && settings?.announcementDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-16"
            >
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6">Waktu Pengumuman Tersisa:</div>
              <Countdown date={settings.announcementDate} />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {isReleased ? (
              <Link to="/cek">
                <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  <Search className="h-5 w-5" />
                  Cek Kelulusan Sekarang
                </Button>
              </Link>
            ) : (
              <Button size="lg" disabled className="h-14 px-8 text-lg font-bold gap-2 grayscale cursor-not-allowed">
                Cek Kelulusan (Segera Hadir)
              </Button>
            )}
          </motion.div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-30" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Search className="h-8 w-8" />,
                title: "Cek Cepat via NISN",
                desc: "Hanya butuh nomor NISN untuk melihat hasil kelulusan Anda secara instan dan akurat."
              },
              {
                icon: <FileText className="h-8 w-8" />,
                title: "Cetak SKL Mandiri",
                desc: "Download dan cetak Surat Keterangan Lulus (SKL) sementara langsung dari sistem dalam format PDF."
              },
              {
                icon: <ShieldCheck className="h-8 w-8" />,
                title: "Validasi QR Code",
                desc: "Dilengkapi dengan sistem validasi QR Code untuk menjamin keaslian data kelulusan siswa."
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-8 rounded-3xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="mb-6 p-4 rounded-2xl bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
