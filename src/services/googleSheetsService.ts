import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAccessToken } from '../lib/googleAuth';

const SPREADSHEET_NAME = 'SIKS_DATA_SPREADSHEET';

export interface SheetData {
  range: string;
  values: any[][];
}

export const googleSheetsService = {
  async getSpreadsheetId(): Promise<string | null> {
    const savedId = localStorage.getItem('siks_spreadsheet_id');
    if (savedId) return savedId;

    // Try to find it in Firestore first (to support public access)
    try {
      const docRef = doc(db, 'config', 'public');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const id = docSnap.data().spreadsheetId;
        if (id) {
          localStorage.setItem('siks_spreadsheet_id', id);
          return id;
        }
      }
    } catch (e) {
      console.warn('Could not read spreadsheetId from Firestore:', e);
    }

    // Try to find it in Google Drive (Admin only)
    const token = getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${SPREADSHEET_NAME}' and trashed=false&fields=files(id)`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.files && data.files.length > 0) {
        const id = data.files[0].id;
        localStorage.setItem('siks_spreadsheet_id', id);
        
        // Sync to Firestore
        await setDoc(doc(db, 'config', 'public'), { spreadsheetId: id }, { merge: true });
        
        return id;
      }
    } catch (error) {
      console.error('Error finding spreadsheet:', error);
    }

    return null;
  },

  async createSpreadsheet(): Promise<string | null> {
    const token = getAccessToken();
    if (!token) return null;

    try {
      // Create Spreadsheet
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title: SPREADSHEET_NAME },
          sheets: [
            { properties: { title: 'Students' } },
            { properties: { title: 'Settings' } }
          ]
        })
      });
      const data = await response.json();
      const id = data.spreadsheetId;
      
      localStorage.setItem('siks_spreadsheet_id', id);

      // Sync to Firestore for public access
      await setDoc(doc(db, 'config', 'public'), { spreadsheetId: id }, { merge: true });

      // Initialize headers for Students
      await this.updateRange(id, 'Students!A1:K1', [
        ['NISN', 'Nama', 'Kelas', 'TTL', 'Status', 'Nilai', 'Pesan', 'Keterangan', 'Program Bantuan', 'Link Berkas', 'Tanggal Update']
      ]);

      // Initialize Settings
      await this.updateRange(id, 'Settings!A1:B1', [['Key', 'Value']]);
      await this.updateRange(id, 'Settings!A2:B7', [
        ['schoolName', 'SMA NEGERI INDONESIA'],
        ['announcementDate', '2026-06-15T10:00'],
        ['isLive', 'true'],
        ['logoUrl', ''],
        ['principalName', 'Drs. H. Mulyadi, M.Pd.'],
        ['principalNip', '197205121998031002']
      ]);

      return id;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      return null;
    }
  },

  async getValues(range: string): Promise<any[][] | null> {
    const id = await this.getSpreadsheetId();
    if (!id) return null;

    const token = getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching values:', error);
      return null;
    }
  },

  async updateRange(spreadsheetId: string | null, range: string, values: any[][]): Promise<void> {
    const id = spreadsheetId || await this.getSpreadsheetId();
    if (!id) return;

    const token = getAccessToken();
    if (!token) return;

    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      );
    } catch (error) {
      console.error('Error updating range:', error);
    }
  },

  async appendValues(range: string, values: any[][]): Promise<void> {
    const id = await this.getSpreadsheetId();
    if (!id) return;

    const token = getAccessToken();
    if (!token) return;

    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      );
    } catch (error) {
      console.error('Error appending values:', error);
    }
  },

  async getPublicValues(spreadsheetId: string, sheetName: string): Promise<any[][] | null> {
    try {
      // Use the gviz endpoint for public sheets
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`
      );
      const text = await response.text();
      // Gviz response is prefixed with "/*O_o*/\ngoogle.visualization.Query.setResponse("
      const jsonStr = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/)?.[1];
      if (!jsonStr) return null;
      
      const data = JSON.parse(jsonStr);
      if (!data.table || !data.table.rows) return null;

      return data.table.rows.map((row: any) => 
        row.c.map((cell: any) => cell ? (cell.v || '') : '')
      );
    } catch (err) {
      console.error('Error fetching public values:', err);
      return null;
    }
  }
};
