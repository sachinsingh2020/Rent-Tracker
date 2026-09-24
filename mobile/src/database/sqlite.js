import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

let SQLite = null;
let dbInstance = null;

if (!isWeb) {
  try {
    SQLite = require('expo-sqlite');
  } catch (_) {}
}

export const getDB = () => {
  if (isWeb) return null;
  if (!dbInstance && SQLite) {
    dbInstance = SQLite.openDatabaseSync('renttracker.db');
  }
  return dbInstance;
};

// Web In-Memory / LocalStorage Mock Store for Web Previews
const webStore = {
  rooms: [
    {
      id: 'room_101',
      roomNumber: '101',
      floor: '1st Floor',
      defaultRent: 6000,
      status: 'Occupied',
      notes: 'Corner room with balcony',
    },
    {
      id: 'room_102',
      roomNumber: '102',
      floor: '1st Floor',
      defaultRent: 5500,
      status: 'Available',
      notes: 'Standard room',
    },
  ],
  tenants: [
    {
      id: 'tenant_1',
      roomId: 'room_101',
      name: 'Ramesh Kumar',
      phone: '+91 9876543210',
      negotiatedRent: 5500,
      securityDeposit: 10000,
      meterNumber: 'MTR-101',
      initialReading: 1200,
      latestReading: 1285,
      status: 'Active',
      moveInDate: '2026-09-01',
    },
  ],
  bills: [
    {
      id: 'bill_1',
      tenantId: 'tenant_1',
      roomId: 'room_101',
      monthYear: 'September 2026',
      billDate: '2026-09-24',
      roomRentAmount: 5500,
      roomRentStatus: 'Paid',
      previousReading: 1200,
      currentReading: 1285,
      unitsConsumed: 85,
      ratePerUnit: 11,
      electricityAmount: 935,
      electricityStatus: 'Pending',
      totalDue: 6435,
      isFullyPaid: 0,
      meterPhotoUrl: '',
      notes: 'Rent received via UPI, electricity due',
    },
  ],
  settings: {
    defaultElectricityRate: 11.0,
    defaultRoomRent: 6000.0,
  },
};

/**
 * Initialize SQLite database tables for Offline Mode
 */
export const initSQLite = () => {
  if (isWeb) {
    console.log('🌐 Web platform detected: Using web storage adapter');
    return;
  }

  try {
    const db = getDB();
    if (!db) return;

    // 1. Rooms Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        cloudId TEXT,
        roomNumber TEXT NOT NULL,
        floor TEXT DEFAULT 'Ground Floor',
        defaultRent REAL DEFAULT 6000,
        status TEXT DEFAULT 'Available',
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    // 2. Tenants Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        cloudId TEXT,
        roomId TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        negotiatedRent REAL DEFAULT 6000,
        securityDeposit REAL DEFAULT 0,
        meterNumber TEXT,
        initialReading REAL DEFAULT 0,
        latestReading REAL DEFAULT 0,
        moveInDate TEXT,
        status TEXT DEFAULT 'Active',
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (roomId) REFERENCES rooms (id)
      );
    `);

    // 3. Monthly Bills Table (Dual Rent & Electricity)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS monthly_bills (
        id TEXT PRIMARY KEY,
        cloudId TEXT,
        tenantId TEXT NOT NULL,
        roomId TEXT NOT NULL,
        monthYear TEXT NOT NULL,
        billDate TEXT,
        roomRentAmount REAL DEFAULT 0,
        roomRentStatus TEXT DEFAULT 'Pending',
        roomRentPaidDate TEXT,
        previousReading REAL DEFAULT 0,
        currentReading REAL DEFAULT 0,
        unitsConsumed REAL DEFAULT 0,
        ratePerUnit REAL DEFAULT 11,
        electricityAmount REAL DEFAULT 0,
        electricityStatus TEXT DEFAULT 'Pending',
        electricityPaidDate TEXT,
        meterPhotoUrl TEXT,
        totalDue REAL DEFAULT 0,
        isFullyPaid INTEGER DEFAULT 0,
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (tenantId) REFERENCES tenants (id),
        FOREIGN KEY (roomId) REFERENCES rooms (id)
      );
    `);

    // 4. Settings Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        defaultElectricityRate REAL DEFAULT 11.0,
        defaultRoomRent REAL DEFAULT 6000.0,
        updatedAt TEXT
      );
    `);

    const setting = db.getFirstSync(`SELECT * FROM settings WHERE key = 'global_defaults'`);
    if (!setting) {
      db.runSync(
        `INSERT INTO settings (key, defaultElectricityRate, defaultRoomRent, updatedAt) VALUES ('global_defaults', 11.0, 6000.0, datetime('now'))`
      );
    }

    console.log('✅ SQLite Database & Tables initialized successfully');
  } catch (error) {
    console.error('❌ SQLite Initialization Error:', error);
  }
};

/**
 * Unified Repository (Native SQLite + Web Adapter)
 */
export const sqliteRepo = {
  // --- Rooms ---
  getRooms: () => {
    if (isWeb) {
      return webStore.rooms.map((room) => {
        const activeTenant = webStore.tenants.find((t) => t.roomId === room.id && t.status === 'Active');
        return { ...room, activeTenant: activeTenant || null };
      });
    }

    const db = getDB();
    const rooms = db.getAllSync(`SELECT * FROM rooms ORDER BY roomNumber ASC`);
    return rooms.map((room) => {
      const activeTenant = db.getFirstSync(
        `SELECT * FROM tenants WHERE roomId = ? AND status = 'Active'`,
        [room.id]
      );
      return { ...room, activeTenant: activeTenant || null };
    });
  },

  createRoom: (roomData) => {
    const id = `room_${Date.now()}`;
    const now = new Date().toISOString();
    const newRoom = { id, ...roomData, status: 'Available', createdAt: now };

    if (isWeb) {
      webStore.rooms.push(newRoom);
      return newRoom;
    }

    const db = getDB();
    db.runSync(
      `INSERT INTO rooms (id, roomNumber, floor, defaultRent, status, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        roomData.roomNumber,
        roomData.floor || 'Ground Floor',
        Number(roomData.defaultRent) || 6000,
        'Available',
        roomData.notes || '',
        now,
        now,
      ]
    );
    return newRoom;
  },

  deleteRoom: (id) => {
    if (isWeb) {
      webStore.rooms = webStore.rooms.filter((r) => r.id !== id);
      return;
    }
    const db = getDB();
    db.runSync(`DELETE FROM rooms WHERE id = ?`, [id]);
  },

  // --- Tenants ---
  getTenants: () => {
    if (isWeb) {
      return webStore.tenants.map((tenant) => {
        const room = webStore.rooms.find((r) => r.id === tenant.roomId);
        const bills = webStore.bills.filter((b) => b.tenantId === tenant.id);
        let pendingRent = 0;
        let pendingElectricity = 0;
        bills.forEach((b) => {
          if (b.roomRentStatus === 'Pending') pendingRent += Number(b.roomRentAmount) || 0;
          if (b.electricityStatus === 'Pending') pendingElectricity += Number(b.electricityAmount) || 0;
        });
        return {
          ...tenant,
          room: room || null,
          pendingRent,
          pendingElectricity,
          totalPendingDue: pendingRent + pendingElectricity,
          totalBillsCount: bills.length,
        };
      });
    }

    const db = getDB();
    const tenants = db.getAllSync(`SELECT * FROM tenants ORDER BY createdAt DESC`);
    return tenants.map((tenant) => {
      const room = db.getFirstSync(`SELECT * FROM rooms WHERE id = ?`, [tenant.roomId]);
      const bills = db.getAllSync(`SELECT * FROM monthly_bills WHERE tenantId = ?`, [tenant.id]);
      let pendingRent = 0;
      let pendingElectricity = 0;
      bills.forEach((b) => {
        if (b.roomRentStatus === 'Pending') pendingRent += Number(b.roomRentAmount) || 0;
        if (b.electricityStatus === 'Pending') pendingElectricity += Number(b.electricityAmount) || 0;
      });
      return {
        ...tenant,
        room: room || null,
        pendingRent,
        pendingElectricity,
        totalPendingDue: pendingRent + pendingElectricity,
        totalBillsCount: bills.length,
      };
    });
  },

  getTenantById: (id) => {
    if (isWeb) {
      const tenant = webStore.tenants.find((t) => t.id === id);
      if (!tenant) return null;
      const room = webStore.rooms.find((r) => r.id === tenant.roomId);
      const bills = webStore.bills.filter((b) => b.tenantId === id);
      let pendingRent = 0;
      let pendingElectricity = 0;
      bills.forEach((b) => {
        if (b.roomRentStatus === 'Pending') pendingRent += Number(b.roomRentAmount) || 0;
        if (b.electricityStatus === 'Pending') pendingElectricity += Number(b.electricityAmount) || 0;
      });
      return {
        tenant: {
          ...tenant,
          room,
          pendingRent,
          pendingElectricity,
          totalPendingDue: pendingRent + pendingElectricity,
        },
        bills,
      };
    }

    const db = getDB();
    const tenant = db.getFirstSync(`SELECT * FROM tenants WHERE id = ?`, [id]);
    if (!tenant) return null;
    const room = db.getFirstSync(`SELECT * FROM rooms WHERE id = ?`, [tenant.roomId]);
    const bills = db.getAllSync(
      `SELECT * FROM monthly_bills WHERE tenantId = ? ORDER BY datetime(billDate) DESC, datetime(createdAt) DESC`,
      [id]
    );
    let pendingRent = 0;
    let pendingElectricity = 0;
    bills.forEach((b) => {
      if (b.roomRentStatus === 'Pending') pendingRent += Number(b.roomRentAmount) || 0;
      if (b.electricityStatus === 'Pending') pendingElectricity += Number(b.electricityAmount) || 0;
    });
    return {
      tenant: {
        ...tenant,
        room,
        pendingRent,
        pendingElectricity,
        totalPendingDue: pendingRent + pendingElectricity,
      },
      bills,
    };
  },

  createTenant: (tenantData) => {
    const id = `tenant_${Date.now()}`;
    const now = new Date().toISOString();
    const newTenant = { id, ...tenantData, status: 'Active', createdAt: now };

    if (isWeb) {
      webStore.tenants.push(newTenant);
      const room = webStore.rooms.find((r) => r.id === tenantData.roomId);
      if (room) room.status = 'Occupied';
      return newTenant;
    }

    const db = getDB();
    db.runSync(
      `INSERT INTO tenants (id, roomId, name, phone, email, negotiatedRent, securityDeposit, meterNumber, initialReading, latestReading, moveInDate, status, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tenantData.roomId,
        tenantData.name,
        tenantData.phone || '',
        tenantData.email || '',
        Number(tenantData.negotiatedRent) || 6000,
        Number(tenantData.securityDeposit) || 0,
        tenantData.meterNumber || '',
        Number(tenantData.initialReading) || 0,
        Number(tenantData.initialReading) || 0,
        tenantData.moveInDate || now,
        'Active',
        tenantData.notes || '',
        now,
        now,
      ]
    );
    db.runSync(`UPDATE rooms SET status = 'Occupied' WHERE id = ?`, [tenantData.roomId]);
    return newTenant;
  },

  vacateTenant: (id) => {
    if (isWeb) {
      const tenant = webStore.tenants.find((t) => t.id === id);
      if (tenant) {
        tenant.status = 'Vacated';
        const otherActive = webStore.tenants.find(
          (t) => t.roomId === tenant.roomId && t.status === 'Active' && t.id !== id
        );
        if (!otherActive) {
          const room = webStore.rooms.find((r) => r.id === tenant.roomId);
          if (room) room.status = 'Available';
        }
      }
      return { success: true };
    }

    const db = getDB();
    const tenant = db.getFirstSync(`SELECT * FROM tenants WHERE id = ?`, [id]);
    if (!tenant) return null;

    db.runSync(`UPDATE tenants SET status = 'Vacated' WHERE id = ?`, [id]);
    const otherActive = db.getFirstSync(
      `SELECT * FROM tenants WHERE roomId = ? AND status = 'Active'`,
      [tenant.roomId]
    );
    if (!otherActive) {
      db.runSync(`UPDATE rooms SET status = 'Available' WHERE id = ?`, [tenant.roomId]);
    }
    return { success: true };
  },

  // --- Monthly Bills ---
  createBill: (billData) => {
    const id = `bill_${Date.now()}`;
    const now = new Date().toISOString();
    const prev = Number(billData.previousReading) || 0;
    const curr = Number(billData.currentReading) || 0;
    const rate = Number(billData.ratePerUnit) || 11;
    const rent = Number(billData.roomRentAmount) || 0;

    const unitsConsumed = Math.round((curr - prev) * 100) / 100;
    const electricityAmount = Math.round(unitsConsumed * rate * 100) / 100;
    const totalDue = Math.round((rent + electricityAmount) * 100) / 100;
    const isFullyPaid = billData.roomRentStatus === 'Paid' && billData.electricityStatus === 'Paid' ? 1 : 0;

    const newBill = {
      id,
      ...billData,
      unitsConsumed,
      electricityAmount,
      totalDue,
      isFullyPaid: Boolean(isFullyPaid),
      createdAt: now,
    };

    if (isWeb) {
      webStore.bills.unshift(newBill);
      const tenant = webStore.tenants.find((t) => t.id === billData.tenantId);
      if (tenant) tenant.latestReading = curr;
      return newBill;
    }

    const db = getDB();
    db.runSync(
      `INSERT INTO monthly_bills (
        id, tenantId, roomId, monthYear, billDate, roomRentAmount, roomRentStatus,
        previousReading, currentReading, unitsConsumed, ratePerUnit, electricityAmount,
        electricityStatus, meterPhotoUrl, totalDue, isFullyPaid, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        billData.tenantId,
        billData.roomId,
        billData.monthYear,
        billData.billDate || now,
        rent,
        billData.roomRentStatus || 'Pending',
        prev,
        curr,
        unitsConsumed,
        rate,
        electricityAmount,
        billData.electricityStatus || 'Pending',
        billData.meterPhotoUrl || '',
        totalDue,
        isFullyPaid,
        billData.notes || '',
        now,
        now,
      ]
    );
    db.runSync(`UPDATE tenants SET latestReading = ? WHERE id = ?`, [curr, billData.tenantId]);
    return newBill;
  },

  updatePaymentStatus: (id, { roomRentStatus, electricityStatus }) => {
    if (isWeb) {
      const bill = webStore.bills.find((b) => b.id === id);
      if (!bill) return null;
      if (roomRentStatus) bill.roomRentStatus = roomRentStatus;
      if (electricityStatus) bill.electricityStatus = electricityStatus;
      bill.isFullyPaid = bill.roomRentStatus === 'Paid' && bill.electricityStatus === 'Paid' ? 1 : 0;
      return bill;
    }

    const db = getDB();
    const bill = db.getFirstSync(`SELECT * FROM monthly_bills WHERE id = ?`, [id]);
    if (!bill) return null;
    const newRentStatus = roomRentStatus || bill.roomRentStatus;
    const newElecStatus = electricityStatus || bill.electricityStatus;
    const isFullyPaid = newRentStatus === 'Paid' && newElecStatus === 'Paid' ? 1 : 0;
    db.runSync(
      `UPDATE monthly_bills SET roomRentStatus = ?, electricityStatus = ?, isFullyPaid = ? WHERE id = ?`,
      [newRentStatus, newElecStatus, isFullyPaid, id]
    );
    return { ...bill, roomRentStatus: newRentStatus, electricityStatus: newElecStatus, isFullyPaid: Boolean(isFullyPaid) };
  },

  getSettings: () => {
    if (isWeb) return webStore.settings;
    const db = getDB();
    const s = db.getFirstSync(`SELECT * FROM settings WHERE key = 'global_defaults'`);
    return s || { defaultElectricityRate: 11.0, defaultRoomRent: 6000.0 };
  },

  updateSettings: (data) => {
    if (isWeb) {
      webStore.settings = {
        defaultElectricityRate: Number(data.defaultElectricityRate) || 11.0,
        defaultRoomRent: Number(data.defaultRoomRent) || 6000.0,
      };
      return webStore.settings;
    }
    const db = getDB();
    db.runSync(
      `UPDATE settings SET defaultElectricityRate = ?, defaultRoomRent = ?, updatedAt = datetime('now') WHERE key = 'global_defaults'`,
      [Number(data.defaultElectricityRate) || 11.0, Number(data.defaultRoomRent) || 6000.0]
    );
    return { defaultElectricityRate: data.defaultElectricityRate, defaultRoomRent: data.defaultRoomRent };
  },

  dumpAllData: () => {
    if (isWeb) return webStore;
    const db = getDB();
    return {
      rooms: db.getAllSync(`SELECT * FROM rooms`),
      tenants: db.getAllSync(`SELECT * FROM tenants`),
      bills: db.getAllSync(`SELECT * FROM monthly_bills`),
      settings: db.getFirstSync(`SELECT * FROM settings WHERE key = 'global_defaults'`),
    };
  },
};
