import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

const JWT_SECRET = 'super_secret_key_123';
const db = new Database('data.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS schools (
    id TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    contactPerson TEXT,
    activeBuses INTEGER,
    status TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    schoolId TEXT,
    licensePlate TEXT,
    capacity INTEGER,
    deviceId TEXT,
    serialNumber TEXT,
    status TEXT,
    lastPing TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(schoolId) REFERENCES schools(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    schoolId TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS GlobalSettings (
    id TEXT PRIMARY KEY,
    maintenanceMode INTEGER,
    mapCenterLat REAL,
    mapCenterLng REAL,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    schoolId TEXT,
    rfidTag TEXT UNIQUE,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    schoolId TEXT
  );

  CREATE TABLE IF NOT EXISTS gps_logs (
    id TEXT PRIMARY KEY,
    busId TEXT,
    lat REAL,
    lng REAL,
    speed REAL,
    timestamp TEXT
  );
`);

// Insert mock data if empty
const countSchools = db.prepare('SELECT COUNT(*) as count FROM schools').get() as { count: number };
if (countSchools.count === 0) {
  const insertSchool = db.prepare(`
    INSERT INTO schools (id, name, address, city, state, contactPerson, activeBuses, status, createdAt)
    VALUES (@id, @name, @address, @city, @state, @contactPerson, @activeBuses, @status, @createdAt)
  `);
  
  const initialSchools = [
    {
      id: 'SCH-2024-001',
      name: 'Oakwood Secondary',
      address: 'Portland, OR',
      city: 'Portland',
      state: 'OR',
      contactPerson: 'Dr. Julianne Moore',
      activeBuses: 24,
      status: 'Active',
      createdAt: '2023-01-15T10:00:00.000Z',
    },
    {
      id: 'SCH-2024-002',
      name: 'Evergreen Academy',
      address: 'Seattle, WA',
      city: 'Seattle',
      state: 'WA',
      contactPerson: 'Marcus Vance',
      activeBuses: 18,
      status: 'Active',
      createdAt: '2023-03-22T14:30:00.000Z',
    },
    {
      id: 'SCH-2024-003',
      name: 'Sunview International',
      address: 'Austin, TX',
      city: 'Austin',
      state: 'TX',
      contactPerson: 'Eleanor Rigby',
      activeBuses: 42,
      status: 'Pending',
      createdAt: '2023-05-10T09:15:00.000Z',
    },
    {
      id: 'SCH-2024-004',
      name: 'Maplewood Prep',
      address: 'Denver, CO',
      city: 'Denver',
      state: 'CO',
      contactPerson: 'Sarah Jenkins',
      activeBuses: 12,
      status: 'Active',
      createdAt: '2023-06-05T11:45:00.000Z',
    },
    {
      id: 'SCH-2024-005',
      name: 'Riverside Technical',
      address: 'San Jose, CA',
      city: 'San Jose',
      state: 'CA',
      contactPerson: 'David Miller',
      activeBuses: 31,
      status: 'Suspended',
      createdAt: '2023-08-19T16:20:00.000Z',
    },
  ];

  const insertSchoolsTx = db.transaction((schools) => {
    for (const school of schools) insertSchool.run(school);
  });
  insertSchoolsTx(initialSchools);
  
  const insertDevice = db.prepare(`
    INSERT INTO devices (id, schoolId, licensePlate, capacity, deviceId, serialNumber, status, lastPing, createdAt, updatedAt)
    VALUES (@id, @schoolId, @licensePlate, @capacity, @deviceId, @serialNumber, @status, @lastPing, @createdAt, @updatedAt)
  `);
  
  const initialDevices = [
    {
      id: 'bus-001',
      schoolId: 'SCH-2024-001',
      licensePlate: 'DL1P-1234',
      capacity: 40,
      deviceId: 'GPS-03-001',
      serialNumber: 'PA-3329-7J22',
      status: 'ONLINE',
      lastPing: '2 mins ago',
      createdAt: '2023-01-15T12:00:00.000Z',
      updatedAt: '2023-01-15T12:00:00.000Z',
    },
    {
      id: 'bus-002',
      schoolId: 'SCH-2024-001',
      licensePlate: 'DL1P-5678',
      capacity: 40,
      deviceId: 'GPS-03-002',
      serialNumber: 'PA-3329-7J45',
      status: 'ONLINE',
      lastPing: 'Now',
      createdAt: '2023-01-15T12:00:00.000Z',
      updatedAt: '2023-01-15T12:00:00.000Z',
    },
    {
      id: 'bus-003',
      schoolId: 'SCH-2024-001',
      licensePlate: 'DL1P-9012',
      capacity: 35,
      deviceId: 'GPS-03-003',
      serialNumber: 'PA-1702-5Q23',
      status: 'OFFLINE',
      lastPing: 'Disconnected',
      createdAt: '2023-01-15T12:00:00.000Z',
      updatedAt: '2023-01-15T12:00:00.000Z',
    },
    {
      id: 'bus-004',
      schoolId: 'SCH-2024-001',
      licensePlate: 'DL1P-3456',
      capacity: 50,
      deviceId: 'GPS-03-004',
      serialNumber: 'PA-3329-Y170',
      status: 'ONLINE',
      lastPing: '5 mins ago',
      createdAt: '2023-01-15T12:00:00.000Z',
      updatedAt: '2023-01-15T12:00:00.000Z',
    },
  ];

  const insertDevicesTx = db.transaction((devices) => {
    for (const device of devices) insertDevice.run(device);
  });
  insertDevicesTx(initialDevices);
  
  // Create super admin user
  const hashedPassword = bcrypt.hashSync('password123', 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password, role, createdAt) 
    VALUES ('uuid-super-admin', 'Super Admin', 'admin@fleet.com', ?, 'SUPER_ADMIN', ?)
  `).run(hashedPassword, new Date().toISOString());

  // Seed students (just a small number to prove the point, plus a dummy count offset if needed, but let's insert 45200 so it matches the real DB scale perfectly)
  console.log('Seeding 45200 students... this might take a second.');
  const insertStudent = db.prepare('INSERT INTO students (id, schoolId, rfidTag, name) VALUES (?, ?, ?, ?)');
  const seedStudents = db.transaction(() => {
    for (let i = 0; i < 45200; i++) {
      insertStudent.run(`STU-${i}`, 'SCH-2024-001', `TAG-${i}`, `Student ${i}`);
    }
  });
  seedStudents();
  console.log('Student seeding complete.');
}

// Also seed initial GlobalSettings if empty
const hasSettings = db.prepare('SELECT count(*) as count FROM GlobalSettings').get() as any;
if (hasSettings.count === 0) {
  db.prepare(`
    INSERT INTO GlobalSettings (id, maintenanceMode, mapCenterLat, mapCenterLng, updatedAt)
    VALUES ('global', 0, 28.7041, 77.1025, ?)
  `).run(new Date().toISOString());
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Endpoints ---

  // Admins API
  app.get('/api/admins', (req, res) => {
    try {
      const admins = db.prepare('SELECT id, name, email, role, schoolId, createdAt FROM users WHERE role IN (?, ?) ORDER BY createdAt DESC').all('SUPER_ADMIN', 'SCHOOL_ADMIN');
      res.json(admins);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/admins', (req, res) => {
    try {
      const { name, email, password, role, schoolId } = req.body;
      const hashedPassword = bcrypt.hashSync(password, 10);
      const id = `ADM-${Date.now()}`;
      db.prepare(`
        INSERT INTO users (id, name, email, password, role, schoolId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, email, hashedPassword, role, schoolId || null, new Date().toISOString());
      res.status(201).json({ id, name, email, role, schoolId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create admin' });
    }
  });

  app.put('/api/admins/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { name, password } = req.body;
      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare('UPDATE users SET name = ?, password = ? WHERE id = ?').run(name, hashedPassword, id);
      } else {
        db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, id);
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update admin' });
    }
  });

  app.delete('/api/admins/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete admin' });
    }
  });

  // Settings API
  app.get('/api/settings', (req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM GlobalSettings WHERE id = ?').get('global');
      res.json(settings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/settings', (req, res) => {
    try {
      const { maintenanceMode, mapCenterLat, mapCenterLng } = req.body;
      db.prepare(`
        UPDATE GlobalSettings 
        SET maintenanceMode = ?, mapCenterLat = ?, mapCenterLng = ?, updatedAt = ?
        WHERE id = 'global'
      `).run(maintenanceMode ? 1 : 0, mapCenterLat, mapCenterLng, new Date().toISOString());
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
      
      res.json({
        token,
        user: {
          id: user.id,
          role: user.role,
          email: user.email,
          schoolId: null, // super admin
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/stats', (req, res) => {
    const totalSchools = (db.prepare('SELECT COUNT(*) as count FROM schools').get() as any).count;
    const totalBuses = (db.prepare('SELECT COUNT(*) as count FROM devices').get() as any).count;
    const offlineDevices = (db.prepare('SELECT COUNT(*) as count FROM devices WHERE status = ?').get('OFFLINE') as any).count;
    const totalStudents = (db.prepare('SELECT COUNT(*) as count FROM students').get() as any).count;
    const onlineDevices = (db.prepare('SELECT COUNT(*) as count FROM devices WHERE status = ?').get('ONLINE') as any).count;
    
    // Simulate stationary for some visual
    const active = Math.floor(onlineDevices * 0.8);
    const stationary = onlineDevices - active;

    res.json({
      totalSchools,
      totalBuses,
      offlineDevices,
      totalStudents,
      active,
      stationary,
      warning: offlineDevices,
    });
  });

  app.get('/api/schools', (req, res) => {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const search = ((req.query.search as string) || '').toLowerCase();
    
    let query = 'SELECT * FROM schools';
    let params: any[] = [];
    
    if (search) {
      query += ' WHERE LOWER(name) LIKE ? OR LOWER(city) LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const countQuery = 'SELECT COUNT(*) as count FROM (' + query + ')';
    const total = (db.prepare(countQuery).get(...params) as any).count;
    
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    
    const schools = db.prepare(query).all(...params);
    res.json({ data: schools, total, page, limit });
  });

  app.post('/api/schools', (req, res) => {
    const { name, address, city, state, contactPerson } = req.body;
    const newSchool = {
      id: `SCH-${Date.now()}`,
      name,
      address,
      city,
      state,
      contactPerson,
      activeBuses: 0,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    
    db.prepare(`
      INSERT INTO schools (id, name, address, city, state, contactPerson, activeBuses, status, createdAt)
      VALUES (@id, @name, @address, @city, @state, @contactPerson, @activeBuses, @status, @createdAt)
    `).run(newSchool);
    
    res.json(newSchool);
  });

  app.delete('/api/schools/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM schools WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/admin/logs', (req, res) => {
    try {
      const logs = db.prepare(`
        SELECT gps_logs.*, devices.serialNumber, schools.name as schoolName
        FROM gps_logs
        LEFT JOIN devices ON gps_logs.busId = devices.id
        LEFT JOIN schools ON devices.schoolId = schools.id
        ORDER BY gps_logs.timestamp DESC
        LIMIT 10
      `).all();
      res.json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/devices/locations', (req, res) => {
    try {
      // Get the latest log for each bus
      const locations = db.prepare(`
        SELECT g.*, d.serialNumber, s.name as schoolName
        FROM gps_logs g
        JOIN devices d ON g.busId = d.id
        LEFT JOIN schools s ON d.schoolId = s.id
        WHERE g.timestamp = (
            SELECT MAX(timestamp) FROM gps_logs WHERE busId = g.busId
        )
      `).all();
      res.json(locations);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/schools/:id/stats', (req, res) => {
    try {
      const { id } = req.params;
      const totalBuses = (db.prepare('SELECT COUNT(*) as count FROM devices WHERE schoolId = ?').get(id) as any).count;
      const totalStudents = (db.prepare('SELECT COUNT(*) as count FROM students WHERE schoolId = ?').get(id) as any).count;
      const totalRoutes = (db.prepare('SELECT COUNT(*) as count FROM routes WHERE schoolId = ?').get(id) as any).count;
      
      res.json({
        totalBuses,
        totalStudents,
        totalRoutes,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/devices', (req, res) => {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const search = ((req.query.search as string) || '').toLowerCase();
    
    let baseQuery = `
      FROM devices 
      LEFT JOIN schools ON devices.schoolId = schools.id
    `;
    let params: any[] = [];
    
    if (search) {
      baseQuery += ' WHERE LOWER(devices.licensePlate) LIKE ? OR LOWER(devices.deviceId) LIKE ? OR LOWER(devices.serialNumber) LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const countQuery = 'SELECT COUNT(*) as count ' + baseQuery;
    const total = (db.prepare(countQuery).get(...params) as any).count;
    
    let query = 'SELECT devices.*, schools.name as schoolName ' + baseQuery;
    query += ' ORDER BY devices.createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    
    const devices = db.prepare(query).all(...params).map((device: any) => ({
      ...device,
      school: { name: device.schoolName }
    }));
    
    res.json({ data: devices, total, page, limit });
  });

  app.post('/api/devices', (req, res) => {
    try {
      const { deviceId, licensePlate, serialNumber, schoolId } = req.body;
      const newDevice = {
        id: `DEV-${Date.now()}`,
        deviceId,
        serialNumber: serialNumber || `SN-${Math.floor(Math.random()*10000)}`,
        schoolId: schoolId || null,
        licensePlate: licensePlate || '',
        status: 'OFFLINE',
        lastPing: 'Never',
        createdAt: new Date().toISOString()
      };
      db.prepare(`
        INSERT INTO devices (id, deviceId, serialNumber, schoolId, licensePlate, status, lastPing, createdAt)
        VALUES (@id, @deviceId, @serialNumber, @schoolId, @licensePlate, @status, @lastPing, @createdAt)
      `).run(newDevice);
      res.json(newDevice);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/devices/:id', (req, res) => {
    try {
      const { schoolId } = req.body;
      db.prepare('UPDATE devices SET schoolId = ? WHERE id = ?').run(schoolId || null, req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/devices/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('Client connected to real-time telemetry socket');
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Simulate hardware hitting /api/telemetry and broadcasting via WS
  setInterval(() => {
    const busId = 'bus-001';
    const lat = 28.7041 + (Math.random() * 0.01 - 0.005);
    const lng = 77.1025 + (Math.random() * 0.01 - 0.005);
    const speed = Math.floor(Math.random() * 40) + 10;
    
    // Log to DB
    db.prepare(`
      INSERT INTO gps_logs (id, busId, lat, lng, speed, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}`,
      busId,
      lat,
      lng,
      speed,
      new Date().toISOString()
    );

    // Broadcast to connected clients
    io.emit('location_update', { busId, lat, lng, speed, timestamp: new Date().toISOString() });
  }, 5000);
}

startServer();
