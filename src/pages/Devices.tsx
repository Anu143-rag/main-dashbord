import { useEffect, useState, FormEvent } from 'react';
import { Cpu, Search, Filter, MoreVertical, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Device } from '../types';

export function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ deviceId: '', serialNumber: '', licensePlate: '' });
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetch(`/api/devices?page=${page}&limit=50&search=${encodeURIComponent(search)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDevices(data);
          setTotalPages(1);
          setTotalCount(data.length);
        } else if (data.data) {
          setDevices(data.data);
          setTotalPages(Math.ceil(data.total / 50) || 1);
          setTotalCount(data.total);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching devices", err);
        setLoading(false);
      });
  }, [search, page]);

  const handleAddDevice = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newDevice = await res.json();
        setDevices([newDevice, ...devices]);
        setIsModalOpen(false);
        setFormData({ deviceId: '', serialNumber: '', licensePlate: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        setDevices(devices.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-800">Hardware Devices</h1>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
            {totalCount} TOTAL
          </span>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Provision Device
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
          <div className="flex flex-col gap-1 w-48">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
            <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>All Statuses</option>
              <option>Online</option>
              <option>Offline</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 max-w-xs">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by Device ID or Serial..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-auto">
            <button 
              onClick={() => { setSearch(''); setPage(1); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Device ID</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned School</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bus License</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last Ping</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Loading devices...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No devices found.
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-indigo-600 font-medium text-xs flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      {device.deviceId}
                    </td>
                    <td className="px-6 py-3 font-mono text-slate-600 text-xs">
                      {device.licensePlate || device.serialNumber}
                    </td>
                    <td className="px-6 py-3 text-slate-800 font-medium">
                      {device.school?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {device.licensePlate || '-'}
                    </td>
                    <td className="px-6 py-3 text-slate-600 font-medium">
                      <span className={device.status === 'OFFLINE' ? 'text-rose-600 font-bold' : ''}>
                        {device.lastPing}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold uppercase",
                        device.status === 'ONLINE' ? "bg-emerald-50 text-emerald-600" :
                        "bg-rose-50 text-rose-600"
                      )}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => handleDeleteDevice(device.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                        title="Delete Device"
                      >
                        <span className="text-xs font-bold">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <span>Showing page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-50"
            >
              &lt;
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded bg-indigo-600 text-white font-medium">{page}</button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Provision Device</h2>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Device ID</label>
                <input required type="text" value={formData.deviceId} onChange={e => setFormData({...formData, deviceId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Serial Number (Optional)</label>
                <input type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">License Plate (Optional)</label>
                <input type="text" value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg">Provision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
