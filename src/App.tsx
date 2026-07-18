/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Schools } from './pages/Schools';
import { SchoolProfile } from './pages/SchoolProfile';
import { Login } from './pages/Login';
import { Devices } from './pages/Devices';
import { Admins } from './pages/Admins';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="schools" element={<Schools />} />
          <Route path="schools/:id" element={<SchoolProfile />} />
          <Route path="devices" element={<Devices />} />
          <Route path="admins" element={<Admins />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
