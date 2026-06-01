'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendChartSectionProps } from './TrendChartSection.types';

export default function TrendChartSection({ data }: TrendChartSectionProps) {
  return (
    <div className="bg-white rounded-2xl p-5 mt-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">점수 변화 추이</h2>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4A86D9" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#4A86D9" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            formatter={(value) => [`${value}점`, '구강 점수']}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#4A86D9"
            strokeWidth={2}
            fill="url(#scoreGradient)"
            dot={{ fill: '#4A86D9', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}