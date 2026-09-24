import React, { createContext, useContext, useState, useEffect } from 'react';
import { initSQLite } from '../database/sqlite';
import { dataService, setStorageMode, getStorageMode } from '../services/dataService';
import { setAuthToken } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [storageMode, setMode] = useState('offline'); // 'offline' | 'cloud'
  const [user, setUser] = useState(null); // Authenticated owner
  const [settings, setSettings] = useState({
    defaultElectricityRate: 11.0,
    defaultRoomRent: 6000.0,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize SQLite on app boot
  useEffect(() => {
    initSQLite();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await dataService.getSettings();
      if (s) {
        setSettings({
          defaultElectricityRate: Number(s.defaultElectricityRate) || 11.0,
          defaultRoomRent: Number(s.defaultRoomRent) || 6000.0,
        });
      }
    } catch (_) {}
  };

  const switchStorageMode = async (newMode, authData = null) => {
    if (authData?.token) {
      setAuthToken(authData.token);
      setUser(authData.user || null);
    } else if (newMode === 'offline') {
      setAuthToken(null);
      setUser(null);
    }

    setMode(newMode);
    setStorageMode(newMode);

    if (newMode === 'cloud') {
      try {
        console.log('🔄 Auto-syncing existing local records to MongoDB Atlas...');
        await dataService.syncToCloud();
        console.log('✅ Auto-sync completed!');
      } catch (err) {
        console.warn('Auto-sync warning:', err.message);
      }
    }

    triggerRefresh();
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AppContext.Provider
      value={{
        storageMode,
        switchStorageMode,
        user,
        settings,
        setSettings,
        loadSettings,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
