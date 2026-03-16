import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  Square, 
  RefreshCw,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Position {
  qty: number;
  entry_price: number;
  side: string;
  timestamp: string;
}

interface BotStatus {
  is_running: boolean;
  is_authenticated: boolean;
  pnl: number;
  trades_count: number;
  active_positions: Record<string, Position>;
  user_mobile: string;
  is_simulation: boolean;
}

export default function App() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBroker, setSelectedBroker] = useState('Fyers');
  const [isRealMode, setIsRealMode] = useState(false);
  const [time, setTime] = useState(new Date());

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/status?broker=${selectedBroker}&mode=${isRealMode ? 'real' : 'paper'}`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Connection to trading engine lost');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [selectedBroker, isRealMode]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="text-emerald-500 w-8 h-8" />
        </motion.div>
      </div>
    );
  }

  const brokerButtons = ['Fyers', 'Zerodha', 'FlatTrade'];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Activity className="text-black w-5 h-5" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">TradeBot Pro</h1>
            </div>

            {/* Broker Selection Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {brokerButtons.map((broker) => (
                <button
                  key={broker}
                  onClick={() => setSelectedBroker(broker)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 shadow-lg ${
                    selectedBroker === broker
                      ? 'bg-orange-500 text-white shadow-orange-500/20'
                      : 'bg-[#8A2BE2] text-white hover:bg-orange-500 shadow-indigo-500/20'
                  }`}
                >
                  {broker}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Paper/Real Toggle */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setIsRealMode(false)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  !isRealMode ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                PAPER
              </button>
              <button
                onClick={() => setIsRealMode(true)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  isRealMode ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                REAL
              </button>
            </div>

            {status?.is_simulation && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border bg-blue-500/10 border-blue-500/20 text-blue-400 uppercase tracking-widest animate-pulse">
                Demo Mode Active
              </div>
            )}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
              status?.is_authenticated 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {status?.is_authenticated ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {status?.is_authenticated ? 'Authenticated' : 'Locked'}
            </div>
            <div className={`w-2 h-2 rounded-full ${status?.is_running ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Market Clock */}
        <div className="flex justify-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative flex flex-col bg-gradient-to-b from-yellow-50 to-amber-200 px-5 py-2.5 rounded-xl border border-amber-300/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                <span className="text-[10px] font-black text-amber-800/60 uppercase tracking-[0.2em]">Live Market Time</span>
              </div>
              <span className="text-3xl font-mono font-black text-amber-950 tabular-nums drop-shadow-sm">
                {formatTime(time)}
              </span>
            </div>
          </motion.div>
        </div>

        {error && isRealMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm"
          >
            <ShieldAlert size={18} />
            {error}
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Daily PnL" 
            value={`₹${(status?.pnl ?? 0).toFixed(2)}`} 
            icon={status?.pnl && status.pnl >= 0 ? <TrendingUp className="text-emerald-400" /> : <TrendingDown className="text-rose-400" />}
            trend={status?.pnl && status.pnl >= 0 ? 'positive' : 'negative'}
          />
          <StatCard 
            label="Trades Today" 
            value={`${status?.trades_count ?? 0}/2`} 
            icon={<LayoutDashboard className="text-zinc-400" />}
          />
          <StatCard 
            label="Active Positions" 
            value={Object.keys(status?.active_positions || {}).length.toString()} 
            icon={<Activity className="text-zinc-400" />}
          />
          <StatCard 
            label="Bot Status" 
            value={status?.is_running ? 'ACTIVE' : 'IDLE'} 
            icon={status?.is_running ? <Play className="text-emerald-400" /> : <Square className="text-zinc-400" />}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Equity Curve</h3>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-white/5 rounded text-zinc-500">Live</span>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <defs>
                      <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="time" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area type="monotone" dataKey="pnl" stroke="#10b981" fillOpacity={1} fill="url(#colorPnL)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Positions Table */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Active Positions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-zinc-500 uppercase text-[10px] tracking-widest font-bold">
                    <tr>
                      <th className="px-6 py-4">Symbol</th>
                      <th className="px-6 py-4">Qty</th>
                      <th className="px-6 py-4">Entry Price</th>
                      <th className="px-6 py-4">Side</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {Object.entries(status?.active_positions || {}).map(([symbol, pos]: [string, Position]) => (
                      <tr key={symbol} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium">{symbol}</td>
                        <td className="px-6 py-4 text-zinc-400">{pos.qty}</td>
                        <td className="px-6 py-4 text-zinc-400">₹{pos.entry_price}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-bold">BUY</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-zinc-500">Live</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {Object.keys(status?.active_positions || {}).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                          No active trades at the moment
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">WhatsApp Control</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <MessageSquare className="text-emerald-500 mt-1" size={18} />
                  <div>
                    <p className="text-xs font-medium text-zinc-300">Target Mobile</p>
                    <p className="text-xs font-bold text-emerald-400 mt-1">{status?.user_mobile || '+91 9490120326'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <Activity className="text-emerald-500 mt-1" size={18} />
                  <div>
                    <p className="text-xs font-medium text-zinc-300">Commands</p>
                    <p className="text-[10px] text-zinc-500 mt-1">START BOT, STOP BOT, STATUS, POSITIONS, P/L</p>
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs text-emerald-400 leading-relaxed">
                    Bot is currently controlled via WhatsApp. All actions are logged and verified via OTP.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Risk Limits</h3>
              <div className="space-y-4">
                <RiskItem label="Max Daily Loss" value="₹3,000" current={Math.abs(Math.min(0, status?.pnl || 0))} max={3000} />
                <RiskItem label="Max Trades" value="2" current={status?.trades_count || 0} max={2} />
                <RiskItem label="MIS Margin" value="5x" current={5} max={5} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend?: 'positive' | 'negative' }) {
  return (
    <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold tracking-tight ${trend === 'positive' ? 'text-emerald-400' : trend === 'negative' ? 'text-rose-400' : 'text-zinc-100'}`}>
        {value}
      </div>
    </div>
  );
}

function RiskItem({ label, value, current, max }: { label: string, value: string, current: number, max: number }) {
  const progress = Math.min(100, (current / max) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-300 font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full rounded-full ${progress > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
        />
      </div>
    </div>
  );
}

const mockChartData = [
  { time: '09:15', pnl: 0 },
  { time: '10:00', pnl: 450 },
  { time: '11:00', pnl: 1200 },
  { time: '12:00', pnl: 800 },
  { time: '13:00', pnl: 1500 },
  { time: '14:00', pnl: 2100 },
  { time: '15:10', pnl: 1850 },
];
