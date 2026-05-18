import React, { useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2, CheckCircle2, XCircle } from 'lucide-react';
import { Student } from '@/types';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface ResultCardProps {
  student: Student;
  onDownload: () => void;
  onPrint: () => void;
}

export default function ResultCard({ student, onDownload, onPrint }: ResultCardProps) {
  const isLulus = student.status === 'LULUS';

  useEffect(() => {
    if (isLulus) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isLulus]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="max-w-4xl mx-auto w-full"
    >
      <Card className="overflow-hidden border-2 shadow-xl">
        <div className={cn(
          "h-3 w-full",
          isLulus ? "bg-green-500" : "bg-red-500"
        )} />
        
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            {isLulus ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <h2 className="text-3xl font-heading font-bold tracking-tight">HASIL KELULUSAN</h2>
          <p className="text-muted-foreground">Tahun Pelajaran 2025/2026</p>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Nama Lengkap</p>
                <p className="text-xl font-bold">{student.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">NISN</p>
                  <p className="font-medium font-mono">{student.nisn}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Kelas</p>
                  <p className="font-medium">{student.class}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tempat, Tanggal Lahir</p>
                <p className="font-medium">{student.birthInfo}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-muted/30 border border-border/50 text-center space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Berdasarkan hasil rapat dewan guru, Anda dinyatakan:</p>
              <Badge 
                variant={isLulus ? "success" : "destructive"} 
                className={cn(
                  "text-3xl px-8 py-3 font-heading font-black tracking-widest",
                   isLulus ? "bg-green-600 hover:bg-green-600" : "bg-red-600 hover:bg-red-600"
                )}
              >
                {student.status}
              </Badge>
              {student.averageScore && (
                <p className="text-sm font-medium">Nilai Rata-rata: <span className="font-bold text-primary">{student.averageScore}</span></p>
              )}
            </div>
          </div>

          {student.message && (
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
              <p className="text-sm italic text-center text-primary/80">"{student.message}"</p>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <QRCodeSVG 
                    value={`SKL-${student.nisn}-${student.status}`} 
                    size={64}
                    level="H"
                  />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">Validasi Digital</p>
                  <p className="text-[9px] text-muted-foreground mt-1 max-w-[120px]">Scan untuk validasi surat keterangan lulus asli.</p>
               </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={onPrint} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Cetak
              </Button>
              <Button onClick={onDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Cetak SKL (PDF)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-[10px] text-muted-foreground mt-4">
        * Ini adalah data sementara hasil kelulusan. Surat Keterangan Lulus (SKL) resmi dapat diambil di sekolah pada jam operasional.
      </p>
    </motion.div>
  );
}
