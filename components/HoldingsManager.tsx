import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Holding } from '../types';
import { analyzeScreenshot } from '../services/geminiService';
import { Upload, Plus, Trash2, TrendingUp, TrendingDown, Loader2, Camera, Edit2, User } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// In China finance: Red = Up/Profit, Green = Down/Loss
const getColor = (value: number) => value >= 0 ? 'text-red-500' : 'text-green-500';

const HoldingsManager: React.FC = () => {
  const { currentUser, currentRoom, allUsers, allHoldings, addHolding, removeHolding, importHoldings, updateHolding } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter holdings: only show current user's, OR if in a room, show all room members' holdings
  const visibleHoldings = allHoldings.filter(h => {
    if (!currentRoom) return h.userId === currentUser?.id;
    return currentRoom.members.includes(h.userId);
  });

  const myHoldings = visibleHoldings.filter(h => h.userId === currentUser?.id);
  const totalMyProfit = myHoldings.reduce((sum, h) => sum + h.profit, 0);

  // New Holding Form State
  const [newStock, setNewStock] = useState<Partial<Holding>>({ name: '', symbol: '', quantity: 0, currentPrice: 0, profit: 0 });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        const extractedHoldings = await analyzeScreenshot(base64Data);
        importHoldings(extractedHoldings);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert("分析截图失败");
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      addHolding({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        updatedAt: Date.now(),
        avgPrice: 0,
        profitPercent: 0,
        notes: '',
        name: newStock.name || 'Stock',
        symbol: newStock.symbol || '',
        quantity: Number(newStock.quantity),
        currentPrice: Number(newStock.currentPrice),
        profit: Number(newStock.profit),
      });
      setShowAddForm(false);
      setNewStock({ name: '', symbol: '', quantity: 0, currentPrice: 0, profit: 0 });
    }
  };

  const handleUpdateNote = (id: string, note: string) => {
    updateHolding(id, { notes: note });
  };

  // Chart Data
  const chartData = visibleHoldings.map(h => ({
    name: h.name,
    value: Math.abs(h.profit) + (h.quantity * h.currentPrice) // Rough estimate of value for chart weight
  })).slice(0, 5); // Top 5
  
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Portfolio Summary Card */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 md:col-span-2 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">我的总盈亏</h3>
              <div className={`text-4xl font-extrabold mt-1 flex items-center gap-2 ${getColor(totalMyProfit)}`}>
                {totalMyProfit >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                {totalMyProfit > 0 ? '+' : ''}{totalMyProfit.toLocaleString()}
              </div>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
               <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 sm:py-2 rounded-lg font-bold text-sm transition disabled:opacity-50 active:scale-95"
              >
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                <span className="whitespace-nowrap">扫截图 (支付宝)</span>
              </button>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 sm:py-2 rounded-lg font-bold text-sm transition active:scale-95"
              >
                <Plus size={18} />
                <span>手动添加</span>
              </button>
            </div>
          </div>
          
          {/* Add Form - Responsive Grid */}
          {showAddForm && (
            <form onSubmit={handleManualAdd} className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700 grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in-down">
              <div className="col-span-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">代码 (Symbol)</label>
                <input placeholder="AAPL" className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 focus:border-blue-500 outline-none text-sm" value={newStock.symbol} onChange={e => setNewStock({...newStock, symbol: e.target.value})} />
              </div>
              <div className="col-span-1">
                 <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">名称</label>
                 <input placeholder="Apple Inc" className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 focus:border-blue-500 outline-none text-sm" value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} required />
              </div>
              <div className="col-span-1">
                 <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">数量</label>
                 <input type="number" placeholder="0" className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 focus:border-blue-500 outline-none text-sm" value={newStock.quantity} onChange={e => setNewStock({...newStock, quantity: Number(e.target.value)})} />
              </div>
              <div className="col-span-1">
                 <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">盈亏金额</label>
                 <input type="number" placeholder="0" className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 focus:border-blue-500 outline-none text-sm" value={newStock.profit} onChange={e => setNewStock({...newStock, profit: Number(e.target.value)})} />
              </div>
              <button type="submit" className="col-span-2 md:col-span-1 mt-auto bg-blue-600 hover:bg-blue-500 text-white rounded p-2 font-bold text-sm transition">保存</button>
            </form>
          )}
        </div>

        {/* Mini Chart */}
        <div className="hidden md:flex bg-slate-800 p-4 rounded-xl border border-slate-700 flex-col items-center justify-center">
           <h4 className="text-slate-400 text-xs uppercase mb-2 font-bold">资产分布</h4>
           <div className="h-32 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={chartData} innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Holdings List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="text-lg font-bold text-white">团队持仓列表</h3>
        </div>
        
        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold">
              <tr>
                <th className="p-4">资产名称</th>
                <th className="p-4">持有人</th>
                <th className="p-4 text-right">盈亏</th>
                <th className="p-4">今日意向/备注</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {visibleHoldings.map((holding) => {
                const owner = allUsers.find(u => u.id === holding.userId);
                return (
                  <tr key={holding.id} className="hover:bg-slate-700/50 transition group">
                    <td className="p-4">
                      <div className="font-bold text-white">{holding.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{holding.symbol}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold border border-slate-600">
                          {owner?.name.substring(0,2).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-300">{owner?.name}</span>
                      </div>
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${getColor(holding.profit)}`}>
                       {holding.profit > 0 ? '+' : ''}{holding.profit.toLocaleString()}
                    </td>
                    <td className="p-4">
                      {holding.userId === currentUser?.id ? (
                        <div className="flex items-center gap-2">
                           <input 
                            className="bg-transparent border-b border-transparent focus:border-blue-500 hover:border-slate-600 outline-none text-sm text-slate-300 w-full transition py-1"
                            placeholder="添加备注..."
                            defaultValue={holding.notes}
                            onBlur={(e) => handleUpdateNote(holding.id, e.target.value)}
                           />
                           <Edit2 size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">{holding.notes || '-'}</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {holding.userId === currentUser?.id && (
                        <button 
                          onClick={() => removeHolding(holding.id)}
                          className="text-slate-500 hover:text-red-400 transition p-2 hover:bg-slate-700 rounded-full"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleHoldings.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    暂无持仓信息，请上传截图或手动添加。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-slate-700">
           {visibleHoldings.map((holding) => {
             const owner = allUsers.find(u => u.id === holding.userId);
             const isOwner = holding.userId === currentUser?.id;
             return (
               <div key={holding.id} className="p-4 hover:bg-slate-750 transition">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <h4 className="font-bold text-white text-base">{holding.name}</h4>
                     <span className="text-xs text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded font-mono">{holding.symbol || 'N/A'}</span>
                   </div>
                   <div className={`text-lg font-bold font-mono ${getColor(holding.profit)}`}>
                      {holding.profit > 0 ? '+' : ''}{holding.profit.toLocaleString()}
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] text-white border border-slate-600">
                          {owner?.name.substring(0,2).toUpperCase()}
                      </div>
                      <span>{owner?.name}</span>
                    </div>
                    {isOwner && (
                       <button 
                         onClick={() => removeHolding(holding.id)}
                         className="text-slate-600 hover:text-red-400 p-1"
                       >
                         <Trash2 size={16} />
                       </button>
                    )}
                 </div>

                 <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                    {isOwner ? (
                       <div className="flex items-center gap-2">
                         <Edit2 size={12} className="text-slate-500 shrink-0" />
                         <input 
                            className="bg-transparent outline-none text-sm text-slate-300 w-full placeholder:text-slate-600"
                            placeholder="添加今日意向/备注..."
                            defaultValue={holding.notes}
                            onBlur={(e) => handleUpdateNote(holding.id, e.target.value)}
                         />
                       </div>
                    ) : (
                       <p className="text-sm text-slate-400 italic flex items-center gap-2">
                         <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                         {holding.notes || '无备注'}
                       </p>
                    )}
                 </div>
               </div>
             );
           })}
           {visibleHoldings.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                暂无持仓。点击“添加”开始。
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default HoldingsManager;