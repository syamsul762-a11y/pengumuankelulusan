import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import ResultCard from '@/components/ResultCard';
import { Student, AppSettings } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { studentService } from '@/services/studentService';
import { settingsService } from '@/services/settingsService';

export default function CheckResult() {
  const [nisn, setNisn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [result, setResult] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        if (data) {
          setSettings(data);
          // Security check: if not live and not admin (well, public cek check)
          const isReleased = data.isLive && new Date() >= new Date(data.announcementDate);
          if (!isReleased) {
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, [navigate]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const student = await studentService.getByNisn(nisn);
      if (student) {
        setResult(student);
      } else {
        setError('Nomor NISN tidak ditemukan. Pastikan nomor yang dimasukkan benar.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mencari data. Silakan coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = (student: Student) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const schoolName = settings?.schoolName || 'SMA NEGERI INDONESIA';
    const prinName = settings?.principalName || 'Drs. H. Mulyadi, M.Pd.';
    const prinNip = settings?.principalNip || '197205121998031002';
    const logoUrl = settings?.logoUrl;

    // Background Header
    doc.setFillColor(72, 100, 255);
    doc.rect(0, 0, 210, 40, 'F');

    // School Logo if exists
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', 10, 5, 25, 25);
      } catch (e) {
        console.warn('Could not add logo to PDF:', e);
      }
    }

    // School Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName.toUpperCase(), 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Alamat: Jl. Pendidikan No. 123, Jakarta Selatan', 105, 22, { align: 'center' });
    doc.text('Website: www.sekolah.sch.id | Email: info@sekolah.sch.id', 105, 27, { align: 'center' });

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SURAT KETERANGAN LULUS (SEMENTARA)', 105, 55, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Nomor: 421/SKL/${new Date().getFullYear()}/012`, 105, 62, { align: 'center' });

    // Content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let y = 80;
    const leftMargin = 30;

    doc.text(`Yang bertanda tangan di bawah ini, Kepala Sekolah ${schoolName} menerangkan bahwa:`, leftMargin, y, { maxWidth: 150 });
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.text('Nama Lengkap', leftMargin, y);
    doc.text(`: ${student.name}`, 80, y);
    y += 8;

    doc.text('NISN', leftMargin, y);
    doc.text(`: ${student.nisn}`, 80, y);
    y += 8;

    doc.text('Kelas', leftMargin, y);
    doc.text(`: ${student.class}`, 80, y);
    y += 8;

    doc.text('Tempat, Tgl Lahir', leftMargin, y);
    doc.text(`: ${student.birthInfo}`, 80, y);
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.text('Berdasarkan hasil kriteria kelulusan akademik dan rapat dewan guru, dinyatakan:', leftMargin, y);
    y += 12;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(student.status === 'LULUS' ? 0 : 200, student.status === 'LULUS' ? 128 : 0, 0);
    doc.text(student.status, 105, y, { align: 'center' });
    
    y += 20;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const msg = student.status === 'LULUS' 
      ? 'Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.'
      : 'Bagi siswa yang dinyatakan tidak lulus, silakan menghubungi wali kelas untuk informasi lebih lanjut.';
    doc.text(msg, leftMargin, y, { maxWidth: 150 });

    // Footer / Signature
    y += 30;
    const rightColumn = 130;
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Jakarta, ${date}`, rightColumn, y);
    y += 7;
    doc.text('Kepala Sekolah,', rightColumn, y);
    
    y += 25;
    doc.setFont('helvetica', 'bold');
    doc.text(prinName, rightColumn, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${prinNip}`, rightColumn, y + 5);

    doc.save(`SKL_${student.nisn}_${student.name}.pdf`);
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-[calc(100vh-16rem)]">
      <div className="max-w-2xl mx-auto mb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-heading font-bold tracking-tight mb-3">Cek Hasil Kelulusan</h1>
          <p className="text-muted-foreground">Silakan masukkan NISN Anda untuk melihat status kelulusan.</p>
        </div>

        <Card className="border-none shadow-2xl bg-primary/5 p-1 rounded-[2rem]">
          <CardContent className="bg-white dark:bg-zinc-950 p-8 rounded-[1.8rem]">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Masukkan 10 digit NISN Anda..."
                  className="pl-12 h-14 text-lg rounded-2xl border-2 focus-visible:ring-primary/20"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-2xl transition-all"
                disabled={isLoading || nisn.length < 5}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sedang Memproses...
                  </>
                ) : (
                  'Lihat Hasil Result'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          </motion.div>
        )}

        {result && (
          <ResultCard 
            student={result} 
            logoUrl={settings?.logoUrl}
            onDownload={() => generatePDF(result)} 
            onPrint={() => window.print()} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
