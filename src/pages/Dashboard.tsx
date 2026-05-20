import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileUp, 
  Settings, 
  LogOut, 
  UserPlus, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  FileSpreadsheet,
  Image as ImageIcon,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student, AppSettings } from '@/types';
import Papa from 'papaparse';
import { studentService } from '@/services/studentService';
import { settingsService } from '@/services/settingsService';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logout, getAccessToken, googleSignIn } from '@/lib/googleAuth';
import { googleSheetsService } from '@/services/googleSheetsService';
import { Countdown } from '@/components/Countdown';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    schoolName: 'SMA NEGERI INDONESIA',
    announcementDate: '2026-06-15T10:00',
    isLive: true,
    principalName: 'Drs. H. Mulyadi, M.Pd.',
    principalNip: '197205121998031002'
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({ status: 'LULUS' });

  // Auth check and initial data fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      if (user.email !== "syamsul762@guru.sd.belajar.id" && user.email !== "admin@siks.com") {
        await auth.signOut();
        navigate('/login');
        return;
      }

      try {
        const id = await googleSheetsService.getSpreadsheetId();
        setSpreadsheetId(id);

        const [fetchedStudents, fetchedSettings] = await Promise.all([
          studentService.getAll(),
          settingsService.getSettings()
        ]);
        setStudents(fetchedStudents);
        if (fetchedSettings) setSettings(fetchedSettings);
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengambil data. Silakan hubungkan akun Google Anda untuk performa penuh.');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const ensureGoogleToken = async (): Promise<boolean> => {
    if (getAccessToken()) return true;
    
    try {
      toast.info('Menghubungkan akun Google Anda untuk izin menyimpan data...');
      const result = await googleSignIn();
      if (result?.accessToken) {
        toast.success('Berhasil terhubung dengan Google Sheets!');
        const id = await googleSheetsService.getSpreadsheetId();
        setSpreadsheetId(id);
        const [fetchedStudents, fetchedSettings] = await Promise.all([
          studentService.getAll(),
          settingsService.getSettings()
        ]);
        setStudents(fetchedStudents);
        if (fetchedSettings) setSettings(fetchedSettings);
        return true;
      }
    } catch (err: any) {
      toast.error('Gagal menghubungkan Google Account: ' + err.message);
    }
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Gagal logout');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.nisn || !newStudent.name) {
      toast.error('NISN dan Nama wajib diisi');
      return;
    }
    
    if (!(await ensureGoogleToken())) return;

    setIsActionLoading(true);
    try {
      const calculatedStatus = newStudent.status || (newStudent.averageScore !== undefined && newStudent.averageScore >= 75 ? 'LULUS' : 'TIDAK LULUS');
      const studentToSave: Student = {
        ...newStudent,
        class: newStudent.class || 'XII',
        status: calculatedStatus,
        birthInfo: newStudent.birthInfo || '',
        averageScore: newStudent.averageScore !== undefined ? newStudent.averageScore : 0
      } as Student;

      await studentService.upsertStudent(studentToSave);
      const updatedStudents = await studentService.getAll();
      setStudents(updatedStudents);
      setIsAddOpen(false);
      setNewStudent({ status: 'LULUS' });
      toast.success('Data siswa berhasil disimpan ke Spreadsheet');
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal menyimpan data: ' + (error.message || 'Error tidak diketahui'));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSyncSpreadsheet = async () => {
    setIsActionLoading(true);
    try {
      const id = await googleSheetsService.syncWithCloud();
      if (id) {
        setSpreadsheetId(id);
        toast.success(`Berhasil terhubung ke Spreadsheet: ${id}`);
        const [fetchedStudents, fetchedSettings] = await Promise.all([
          studentService.getAll(),
          settingsService.getSettings()
        ]);
        setStudents(fetchedStudents);
        if (fetchedSettings) setSettings(fetchedSettings);
      } else {
        toast.error('Spreadsheet tidak ditemukan di Google Drive anda.');
      }
    } catch (error: any) {
      toast.error('Gagal sinkronisasi: ' + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSetupSpreadsheet = async () => {
    setIsActionLoading(true);
    try {
      toast.info('Sedang membuat Spreadsheet baru...');
      const id = await googleSheetsService.createSpreadsheet();
      if (id) {
        setSpreadsheetId(id);
        toast.success('Spreadsheet berhasil dibuat dan dikoneksikan');
        // Reload data
        const [fetchedStudents, fetchedSettings] = await Promise.all([
          studentService.getAll(),
          settingsService.getSettings()
        ]);
        setStudents(fetchedStudents);
        if (fetchedSettings) setSettings(fetchedSettings);
      } else {
        throw new Error('Gagal membuat spreadsheet');
      }
    } catch (error: any) {
      toast.error('Gagal menyiapkan spreadsheet: ' + error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (nisn: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      if (!(await ensureGoogleToken())) return;
      try {
        await studentService.deleteStudent(nisn);
        setStudents(students.filter(s => s.nisn !== nisn));
        toast.success('Data siswa berhasil dihapus');
      } catch (error) {
        toast.error('Gagal menghapus data');
      }
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!(await ensureGoogleToken())) return;
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const importedData = results.data.map((row: any) => ({
            nisn: row.NISN || row.nisn,
            name: row.Nama || row.name,
            class: row.Kelas || row.class,
            birthInfo: row.TTL || row.birthInfo,
            status: (row.Status || row.status)?.toUpperCase() === 'LULUS' ? 'LULUS' : 'TIDAK LULUS',
            averageScore: parseFloat(row.Nilai || row.averageScore) || undefined,
            message: row.Pesan || row.message,
          })).filter(s => s.nisn && s.name);
          
          if (importedData.length === 0) {
            toast.error('Format CSV tidak valid atau data kosong.');
            return;
          }

          setIsActionLoading(true);
          try {
            const count = await studentService.importStudents(importedData as Student[]);
            const updatedStudents = await studentService.getAll();
            setStudents(updatedStudents);
            toast.success(`${count} data berhasil diimpor.`);
          } catch (error) {
            toast.error('Gagal mengimpor data');
          } finally {
            setIsActionLoading(false);
          }
        }
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!(await ensureGoogleToken())) return;
    setIsActionLoading(true);
    try {
      await settingsService.updateSettings(settings);
      toast.success('Pengaturan berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setIsActionLoading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvData = [
      ['NISN', 'Nama', 'Kelas', 'TTL', 'Status', 'Nilai', 'Pesan', 'Keterangan', 'Bantuan', 'Link'],
      ['1234567890', 'Ahmad Jauhari', 'XII IPA 1', 'Jakarta, 12-05-2008', 'LULUS', '92.5', 'Selamat!', 'Penerima KIP', 'PIP', 'https://berkas.com/123'],
      ['0987654321', 'Siti Aminah', 'XII IPS 2', 'Bandung, 01-06-2008', 'TIDAK LULUS', '75.0', 'Tingkatkan belajar.', '-', '-', '-']
    ];
    const csvContent = csvData.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_import_siks.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 40000) {
        toast.error('Logo terlalu besar. Maksimal 40KB agar bisa tersimpan di Spreadsheet.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
        toast.success('Logo berhasil dipilih. Klik Simpan untuk memperbarui.');
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.nisn.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Memuat data dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-black">Dashboard Admin</h1>
          <p className="text-muted-foreground">Kelola data kelulusan siswa {settings.schoolName}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="gap-2" onClick={downloadCsvTemplate}>
             <Download className="h-4 w-4" />
             Format CSV
           </Button>
           <Button variant="destructive" className="gap-2" onClick={handleLogout}>
             <LogOut className="h-4 w-4" />
             Logout
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="md:col-span-4 overflow-hidden border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-medium text-primary uppercase flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" /> Hitung Mundur Pengumuman
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Countdown date={settings.announcementDate} />
            <p className="text-center text-xs text-muted-foreground">
              Target: {new Date(settings.announcementDate).toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <Users className="h-4 w-4" /> Total Siswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Lulus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.status === 'LULUS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" /> Belum Lulus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {students.filter(s => s.status !== 'LULUS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Penyimpanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono truncate max-w-full text-primary min-h-[40px] flex items-center" title={spreadsheetId || 'Not set'}>
              {spreadsheetId ? (
                <a 
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  Buka Google Sheet <Edit className="h-3 w-3" />
                </a>
              ) : (
                <div className="flex flex-col gap-1 w-full">
                  <Button variant="outline" size="sm" className="h-8 text-[10px] w-full" onClick={handleSyncSpreadsheet} disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Search className="h-3 w-3 mr-1" />}
                    Cari Spreadsheet
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] w-full" onClick={handleSetupSpreadsheet} disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                    Buat Baru
                  </Button>
                </div>
              )}
            </div>
            {spreadsheetId && (
              <p className="text-[9px] text-muted-foreground mt-1">
                * Pastikan Sheet memiliki akses "Siapa saja dengan link dapat melihat" untuk publik.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="data" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="data" className="rounded-lg gap-2">
            <Users className="h-4 w-4" /> Data Siswa
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg gap-2">
            <Settings className="h-4 w-4" /> Pengaturan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NISN..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="file"
                  id="import-csv"
                  className="hidden"
                  accept=".csv"
                  onChange={handleImport}
                />
                <Button variant="outline" className="gap-2" asChild disabled={isActionLoading}>
                  <label htmlFor="import-csv" className="cursor-pointer">
                    {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                    Import CSV
                  </label>
                </Button>
              </div>
              
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" disabled={isActionLoading}>
                    <UserPlus className="h-4 w-4" /> Tambah Siswa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Tambah Data Siswa</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddStudent} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label>Nama Siswa</Label>
                         <Input 
                            required 
                            placeholder="Nama Lengkap Siswa"
                            value={newStudent.name || ''}
                            onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                         <Label>NISN</Label>
                         <Input 
                            required 
                            placeholder="Contoh: 1234567890" 
                            value={newStudent.nisn || ''}
                            onChange={e => setNewStudent({...newStudent, nisn: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                         <Label>Tempat, Tanggal Lahir</Label>
                         <Input 
                            required 
                            placeholder="Contoh: Jakarta, 12 Mei 2008"
                            value={newStudent.birthInfo || ''}
                            onChange={e => setNewStudent({...newStudent, birthInfo: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                         <Label>Nilai Rata-rata</Label>
                         <Input 
                            required
                            type="number" 
                            step="0.01" 
                            placeholder="Contoh: 85.50"
                            value={newStudent.averageScore || ''}
                            onChange={e => setNewStudent({...newStudent, averageScore: parseFloat(e.target.value)})}
                          />
                       </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full" disabled={isActionLoading}>
                        {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Data
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[150px]">NISN</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id || student.nisn}>
                      <TableCell className="font-mono">{student.nisn}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'LULUS' ? 'success' : 'destructive'}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600"
                            onClick={() => {
                              setNewStudent(student);
                              setIsAddOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-600"
                            onClick={() => handleDelete(student.nisn)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Tidak ada data siswa ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nama Sekolah</Label>
                    <Input 
                      value={settings.schoolName} 
                      onChange={e => setSettings({...settings, schoolName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Pengumuman (ISO)</Label>
                    <Input 
                      type="datetime-local" 
                      value={settings.announcementDate}
                      onChange={e => setSettings({...settings, announcementDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Kepala Sekolah</Label>
                    <Input 
                      value={settings.principalName}
                      onChange={e => setSettings({...settings, principalName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NIP Kepala Sekolah</Label>
                    <Input 
                      value={settings.principalNip}
                      onChange={e => setSettings({...settings, principalNip: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                     <Label>Logo Sekolah</Label>
                     <div className="flex items-center gap-4">
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 object-contain border rounded p-1 bg-white" />
                        ) : (
                          <div className="h-16 w-16 border rounded flex items-center justify-center bg-muted">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload}
                            className="cursor-pointer"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">Gunakan gambar persegi (PNG/JPG, max 200KB)</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isLive" 
                    checked={settings.isLive} 
                    onChange={e => setSettings({...settings, isLive: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isLive">Aktifkan Pengumuman (Publik)</Label>
               </div>
               <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="showCountdown" 
                    checked={settings.showCountdown !== false} 
                    onChange={e => setSettings({...settings, showCountdown: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="showCountdown">Tampilkan Hitung Mundur di Beranda Depan</Label>
               </div>
               <div className="flex justify-end">
                 <Button className="gap-2" onClick={handleSaveSettings} disabled={isActionLoading}>
                   {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                   Simpan Perubahan
                 </Button>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

