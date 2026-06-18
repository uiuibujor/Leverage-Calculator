import React, { useState, useMemo } from 'react';
import { Calculator as CalcIcon, DollarSign, TrendingDown, TrendingUp, AlertCircle, Percent, ArrowRight, ShieldAlert, Target, Sparkles, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Calculator() {
  const [capital, setCapital] = useState<string>('10000');
  const [riskAmount, setRiskAmount] = useState<string>('200');
  const [entryPrice, setEntryPrice] = useState<string>('60000');
  const [stopLossPrice, setStopLossPrice] = useState<string>('58000');
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('');
  
  const [isRecommending, setIsRecommending] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const result = useMemo(() => {
    const cap = parseFloat(capital);
    const risk = parseFloat(riskAmount);
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLossPrice);
    const tp = parseFloat(takeProfitPrice);

    if (isNaN(cap) || isNaN(risk) || isNaN(entry) || isNaN(sl) || entry === sl || cap <= 0 || risk <= 0 || entry <= 0 || sl <= 0) {
      return null;
    }

    const isLong = entry > sl;
    const priceDiff = Math.abs(entry - sl);
    const slPercent = (priceDiff / entry) * 100;
    const positionQuantity = risk / priceDiff;
    const positionValue = positionQuantity * entry;
    // We calculate "effective leverage" as: PositionValue / Capital
    const leverage = positionValue / cap;
    const riskPercent = (risk / cap) * 100;

    let expectedProfitValue: number | null = null;
    let rrRatio: number | null = null;
    let tpPercent: number | null = null;

    if (!isNaN(tp) && tp > 0) {
      const isTpValid = isLong ? tp > entry : tp < entry;
      if (isTpValid) {
        const profitDiff = Math.abs(tp - entry);
        tpPercent = (profitDiff / entry) * 100;
        expectedProfitValue = positionQuantity * profitDiff;
        rrRatio = expectedProfitValue / risk;
      }
    }

    return {
      isLong,
      slPercent,
      positionQuantity,
      positionValue,
      leverage,
      riskPercent,
      tpPercent,
      expectedProfitValue,
      rrRatio
    };
  }, [capital, riskAmount, entryPrice, stopLossPrice, takeProfitPrice]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  const formatNumber = (val: number, maxDecimals: number = 4) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxDecimals }).format(val);
  };

  const handleAiRecommend = async () => {
    setIsRecommending(true);
    setAiExplanation(null);
    try {
      const isLong = parseFloat(entryPrice) > parseFloat(stopLossPrice);
      const response = await fetch('/api/recommend-sl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capital,
          entryPrice,
          stopLossPrice,
          takeProfitPrice,
          isLong
        }),
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const data = await response.json();
      if (data.recommendedRiskAmount) {
        setRiskAmount(data.recommendedRiskAmount.toString());
      }
      if (data.explanation) {
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error(err);
      setAiExplanation("AI计算失败，请检查网络或刷新重试。");
    } finally {
      setIsRecommending(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl flex flex-col font-sans text-slate-900 overflow-hidden border border-slate-100">
      {/* Header Section */}
      <header className="px-6 md:px-10 pt-8 pb-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-slate-900">
            杠杆仓位计算器 <span className="text-slate-400 font-extralight block sm:inline">/ Position Calculator</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm uppercase tracking-widest font-medium">根据固定止损计算开仓</p>
        </div>
        <div className="flex space-x-2">
          <div className="px-3 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600 tracking-tighter">USDT</div>
          <div className="px-3 py-1 bg-blue-50 rounded text-xs font-bold text-blue-600 tracking-tighter">CRYPTO</div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Input Column */}
        <section className="lg:col-span-5 bg-slate-50/50 p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 space-y-8">
          
          {/* Input Group: Capital */}
          <div className="space-y-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">账户本金 & 风险控制</label>
            <div className="space-y-4">
              {/* Capital Input */}
              <div>
                <span className="text-xs text-slate-500 mb-1.5 block">账户总额 (Capital)</span>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-300"
                  placeholder="10000"
                />
              </div>

              {/* Risk Amount Form */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-xs text-slate-500 block">固定止损金额 (Risk Amount)</span>
                  <button 
                    onClick={handleAiRecommend}
                    disabled={isRecommending || !capital}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {isRecommending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                    AI 智能推荐
                  </button>
                </div>
                <input
                  type="number"
                  value={riskAmount}
                  onChange={(e) => setRiskAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-lg font-medium text-red-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-300"
                  placeholder="100"
                />
                
                {aiExplanation && (
                  <div className="mt-2.5 p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">{aiExplanation}</p>
                  </div>
                )}

                {result && !aiExplanation && (
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">
                    占账户总额的 {result.riskPercent.toFixed(2)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Input Group: Trade Specs */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">交易参数</label>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Entry Price */}
                <div>
                  <span className="text-xs text-slate-500 mb-1.5 block">进场价格 (Entry)</span>
                  <input
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-300"
                    placeholder="60000"
                  />
                </div>

                {/* Stop Loss Price */}
                <div>
                  <span className="text-xs text-slate-500 mb-1.5 block">止损价格 (Stop Loss)</span>
                  <input
                    type="number"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-lg font-medium text-red-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-300"
                    placeholder="58000"
                  />
                </div>
              </div>

              {/* Take Profit Price */}
              <div>
                <span className="text-xs text-slate-500 mb-1.5 block">预期止盈 (Take Profit) <span className="text-slate-400 font-normal">- 选填</span></span>
                <input
                  type="number"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-lg font-medium text-emerald-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-300"
                  placeholder="可选项: 如 66000"
                />
              </div>
            </div>
          </div>

        </section>

        {/* Results Column */}
        <section className="lg:col-span-7 p-6 md:p-12 flex flex-col">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-8 md:gap-12">
                {/* Position Quantity */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">建议仓位数量</p>
                  <div className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tighter text-slate-900 truncate">
                    {formatNumber(result.positionQuantity)}
                  </div>
                  <p className="text-slate-400 font-medium text-sm sm:text-base">
                    币/股 <span className="text-slate-300">/ Units</span>
                  </p>
                </div>

                {/* Leverage */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">实际杠杆倍数</p>
                  <div className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tighter text-blue-600 truncate">
                    {formatNumber(result.leverage, 2)}<span className="text-2xl ml-1">x</span>
                  </div>
                  <p className="text-slate-400 font-medium text-sm sm:text-base">
                    全仓参考杠杆 <span className="text-slate-300">/ Leverage</span>
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-8">
                <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">核心明细 (Core Breakdown)</span>
                    <div className="flex gap-2">
                      {result.rrRatio !== null && (
                        <span className="text-xs px-2 py-1 rounded font-medium text-blue-600 bg-blue-50 border border-blue-100">
                          盈亏比 1:{formatNumber(result.rrRatio, 2)}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded font-medium ${result.isLong ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-rose-600 bg-rose-50 border border-rose-100'}`}>
                        方向: {result.isLong ? '做多 LONG' : '做空 SHORT'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-slate-500 text-sm">总头寸价值 (Notional Value)</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(result.positionValue)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-slate-500 text-sm">止损幅度 (Stop Loss %)</span>
                      <span className="font-mono font-bold text-slate-900">{result.slPercent.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-slate-500 text-sm">预计亏损 (Fixed Loss)</span>
                      <span className="font-mono font-bold text-rose-500">-${formatNumber(parseFloat(riskAmount))} <span className="text-slate-300 text-xs font-normal">({result.riskPercent.toFixed(2)}%)</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">预期收益 (Expected Profit)</span>
                      {result.expectedProfitValue !== null ? (
                        <span className="font-mono font-bold text-emerald-500">+{formatCurrency(result.expectedProfitValue)} <span className="text-slate-300 text-xs font-normal">({result.tpPercent?.toFixed(2)}%)</span></span>
                      ) : (
                        <span className="font-mono text-slate-300 text-sm">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {result.expectedProfitValue !== null && (
                  <div className="mt-6 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 w-full text-left">风险收益比例</span>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '预期收益 (Profit)', value: result.expectedProfitValue },
                              { name: '预计亏损 (Risk)', value: parseFloat(riskAmount) },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="value"
                            stroke="none"
                            paddingAngle={2}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f43f5e" />
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#64748b' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-start space-x-3 text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></div>
                  <p className="text-xs">该杠杆下若触发止损价，账户亏损金额为设定的固定止损金，不包含交易手续费和滑点风险。</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <Target className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-400 mb-2">等待数据输入</h3>
              <p className="text-slate-400/80 text-sm max-w-[260px]">
                请输入有效的账户本金、止损金额及价格来预览仓位分析。
              </p>
            </div>
          )}
        </section>
      </main>
      
      {/* Footer Decorative */}
      <footer className="px-6 md:px-10 py-4 bg-slate-900 text-slate-500 text-[10px] flex justify-between uppercase tracking-[0.05em] sm:tracking-[0.2em]">
        <span className="hidden sm:inline">Precision: 0.00000001</span>
        <span>Clean Minimalism V1</span>
        <span className="hidden sm:inline">No Financial Advice Intended</span>
      </footer>
    </div>
  );
}
