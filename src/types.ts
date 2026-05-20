export interface Student {
  id?: string;
  nisn: string;
  name: string;
  class: string;
  birthInfo: string;
  status: 'LULUS' | 'TIDAK LULUS';
  averageScore?: number;
  message?: string;
  keterangan?: string;
  bantuanProgram?: string;
  linkBerkas?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AppSettings {
  schoolName: string;
  announcementDate: string;
  isLive: boolean;
  logoUrl?: string;
  principalName: string;
  principalNip: string;
  showCountdown: boolean;
}
