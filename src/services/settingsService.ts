import { AppSettings } from '../types';
import { googleSheetsService } from './googleSheetsService';

export const settingsService = {
  async getSettings(): Promise<AppSettings | null> {
    try {
      let values = await googleSheetsService.getValues('Settings!A2:B');
      
      // Fallback for public
      if (!values) {
        const id = await googleSheetsService.getSpreadsheetId();
        if (id) {
          values = await googleSheetsService.getPublicValues(id, 'Settings');
          if (values && values[0][0] === 'Key') values = values.slice(1);
        }
      }

      if (!values) return null;

      const settings: any = {};
      values.forEach(row => {
        if (!row[0]) return;
        const key = row[0];
        let value = row[1];
        
        // Type conversion
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        
        settings[key] = value;
      });

      return settings as AppSettings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  },

  async updateSettings(settings: AppSettings): Promise<void> {
    try {
      const rows = Object.entries(settings).map(([key, value]) => [key, String(value)]);
      await googleSheetsService.updateRange(null, 'Settings!A2:B', rows);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }
};
