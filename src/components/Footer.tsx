import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-heading text-lg font-bold">SIKS</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sistem Informasi Kelulusan Sekolah adalah platform digital untuk memudahkan siswa dan orang tua dalam melihat hasil kelulusan secara cepat dan transparan.
            </p>
          </div>
          
          <div>
            <h3 className="font-heading font-semibold mb-4">Navigasi</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/" className="hover:text-primary transition-colors">Beranda</a></li>
              <li><a href="/cek" className="hover:text-primary transition-colors">Cek Kelulusan</a></li>
              <li><a href="/login" className="hover:text-primary transition-colors">Admin Login</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4">Kontak Sekolah</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📍 Alamat Sekolah</li>
              <li>📞 (021) 12345678</li>
              <li>✉️ info@sekolah.sch.id</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SIKS - Sistem Informasi Kelulusan Sekolah. Seluruh hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
