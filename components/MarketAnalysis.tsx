import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { analyzeMarketTrends } from '../services/geminiService';
import { MarketTrend } from '../types';
import { Sparkles, ExternalLink, Loader2, RefreshCcw } from 'lucide-react';

const MarketAnalysis: React.FC = () => {
  const { allHoldings, currentRoom, currentUser } = useApp();
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(false);

  // Determine which holdings to analyze
  const visibleHoldings = allHoldings.filter(h => {
    if (!currentRoom) return h.userId === currentUser?.id;
    return currentRoom.members.includes(h.userId);
  });

  const handleAnalyze = async () => {
    if (visibleHoldings.length === 0) return;
    setLoading(true);
    try {
      const results = await analyzeMarketTrends(visibleHoldings);
      setTrends(results);
    } catch (e) {
      console.error(e);
      alert("获取市场趋势失败，请检查API Key或网络。");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (s: string) => {
    switch (s) {
      case 'bullish': return 'bg-red-500/20 text-red-400 border-red-500/30'; // Red = Up
      case 'bearish': return 'bg-green-500/20 text-green-400 border-green-500/30'; // Green = Down
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-800/50 p-6 rounded-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
            <Sparkles className="text-yellow-400" />
            AI 市场情报 (Market Intelligence)
          </h2>
          <p className="text-slate-400 mb-4 max-w-2xl">
            使用 Google Search Grounding 为团队持仓生成实时市场洞察与新闻摘要。
          </p>
          <button
            onClick={handleAnalyze}
            disabled={loading || visibleHoldings.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCcw size={18} />}
            {loading ? '正在分析市场...' : '生成分析报告'}
          </button>
        </div>
        {/* Decorative BG element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trends.map((trend, idx) => (
          <div key={idx} className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-blue-500/50 transition">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-white">{trend.symbol}</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold border ${getSentimentColor(trend.sentiment)} uppercase tracking-wide`}>
                {trend.sentiment}
              </span>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {trend.summary}
            </p>

            {trend.sources.length > 0 && (
              <div className="border-t border-slate-700 pt-3">
                <p className="text-xs text-slate-500 mb-2 font-semibold">来源:</p>
                <div className="flex flex-wrap gap-2">
                  {trend.sources.map((source, sIdx) => (
                    <a 
                      key={sIdx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-900/30 px-2 py-1 rounded transition"
                    >
                      {source.title.substring(0, 20)}... <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {trends.length === 0 && !loading && (
          <div className="col-span-1 md:col-span-2 text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
            <p className="text-slate-500">暂无分析报告。点击上方按钮开始生成。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketAnalysis;