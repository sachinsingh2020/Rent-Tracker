import { sqliteRepo } from '../database/sqlite';
import { api } from './api';

let currentStorageMode = 'offline'; // 'offline' | 'cloud'

export const setStorageMode = (mode) => {
  currentStorageMode = mode;
};

export const getStorageMode = () => currentStorageMode;

/**
 * Unified Data Service:
 * Automatically uses Local SQLite in Offline Mode, or MongoDB REST API in Cloud Mode!
 */
export const dataService = {
  // Rooms
  getRooms: async () => {
    if (currentStorageMode === 'cloud') {
      try {
        return await api.getRooms();
      } catch (err) {
        console.warn('Cloud fetch failed, falling back to local SQLite:', err.message);
        return sqliteRepo.getRooms();
      }
    }
    return sqliteRepo.getRooms();
  },

  createRoom: async (roomData) => {
    if (currentStorageMode === 'cloud') {
      try {
        const cloudRoom = await api.createRoom(roomData);
        // Also save copy locally
        sqliteRepo.createRoom({ ...roomData, cloudId: cloudRoom._id });
        return cloudRoom;
      } catch (err) {
        console.warn('Cloud create failed, saving to local SQLite:', err.message);
        return sqliteRepo.createRoom(roomData);
      }
    }
    return sqliteRepo.createRoom(roomData);
  },

  deleteRoom: async (id) => {
    if (currentStorageMode === 'cloud') {
      try {
        await api.deleteRoom(id);
      } catch (_) {}
    }
    return sqliteRepo.deleteRoom(id);
  },

  // Tenants
  getTenants: async () => {
    if (currentStorageMode === 'cloud') {
      try {
        return await api.getTenants();
      } catch (err) {
        console.warn('Cloud fetch failed, falling back to local SQLite:', err.message);
        return sqliteRepo.getTenants();
      }
    }
    return sqliteRepo.getTenants();
  },

  getTenantById: async (id) => {
    if (currentStorageMode === 'cloud') {
      try {
        return await api.getTenantById(id);
      } catch (err) {
        return sqliteRepo.getTenantById(id);
      }
    }
    return sqliteRepo.getTenantById(id);
  },

  createTenant: async (tenantData) => {
    if (currentStorageMode === 'cloud') {
      try {
        const cloudTenant = await api.createTenant(tenantData);
        sqliteRepo.createTenant({ ...tenantData, cloudId: cloudTenant._id });
        return cloudTenant;
      } catch (err) {
        console.warn('Cloud tenant create failed, saving to local SQLite:', err.message);
        return sqliteRepo.createTenant(tenantData);
      }
    }
    return sqliteRepo.createTenant(tenantData);
  },

  vacateTenant: async (id) => {
    if (currentStorageMode === 'cloud') {
      try {
        await api.vacateTenant(id);
      } catch (_) {}
    }
    return sqliteRepo.vacateTenant ? sqliteRepo.vacateTenant(id) : null;
  },

  // Monthly Bills
  createBill: async (billData) => {
    if (currentStorageMode === 'cloud') {
      try {
        let meterPhotoUrl = billData.meterPhotoUrl;
        // Upload photo to Cloudinary if local file URI
        if (meterPhotoUrl && meterPhotoUrl.startsWith('file://')) {
          try {
            const uploadRes = await api.uploadPhoto(meterPhotoUrl);
            meterPhotoUrl = uploadRes.url || meterPhotoUrl;
          } catch (uploadErr) {
            console.warn('Photo upload failed:', uploadErr);
          }
        }

        const cloudBill = await api.createBill({ ...billData, meterPhotoUrl });
        sqliteRepo.createBill({ ...billData, meterPhotoUrl, cloudId: cloudBill._id });
        return cloudBill;
      } catch (err) {
        console.warn('Cloud bill create failed, saving to local SQLite:', err.message);
        return sqliteRepo.createBill(billData);
      }
    }
    return sqliteRepo.createBill(billData);
  },

  updatePaymentStatus: async (id, statusUpdates) => {
    if (currentStorageMode === 'cloud') {
      try {
        await api.updatePaymentStatus(id, statusUpdates);
      } catch (_) {}
    }
    return sqliteRepo.updatePaymentStatus(id, statusUpdates);
  },

  // Settings
  getSettings: async () => {
    if (currentStorageMode === 'cloud') {
      try {
        return await api.getSettings();
      } catch (_) {
        return sqliteRepo.getSettings();
      }
    }
    return sqliteRepo.getSettings();
  },

  updateSettings: async (data) => {
    if (currentStorageMode === 'cloud') {
      try {
        await api.updateSettings(data);
      } catch (_) {}
    }
    return sqliteRepo.updateSettings(data);
  },

  // Cloud Migration / Sync
  syncToCloud: async () => {
    const localData = sqliteRepo.dumpAllData();
    const result = await api.syncOfflineData(localData);
    return result;
  },
};
