import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TimeRange, UsageEvent } from '../types';
import { processStats, getUniqueModels } from '../utils/statsService';

interface DashboardProps {
  data: UsageEvent[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const processedData = useMemo(() => {
    return processStats(data, timeRange);
  }, [data, timeRange]);

  const uniqueModels = useMemo(() => getUniqueModels(processedData), [processedData]);

  const formatDate = (dateStr: string): string => {
    if (timeRange === '1d') {
      // For hourly data, show HH:00 format
      const hour = dateStr.substring(11, 13);
      return `${hour}:00`;
    } else {
      // For daily data, show MM-DD
      return dateStr.substring(5);
    }
  };

  return (
    <div style={{ width: '100%', marginTop: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Time Range: </label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          style={{ padding: '5px', borderRadius: '4px', color: '#000' }}
        >
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {processedData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `$${value.toFixed(4)}`}
              labelFormatter={(label) => {
                if (timeRange === '1d') {
                  // label format is "2025-11-18T20"
                  const hour = label.substring(11, 13);
                  return `Hour: ${hour}:00`;
                } else {
                  return `Date: ${label}`;
                }
              }}
            />
            <Legend />
            {uniqueModels.map((model, index) => (
              <Bar
                key={model}
                dataKey={model}
                stackId="cost"
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ width: '100%', textAlign: 'center' }}>No data for this range.</p>
      )}

      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        <h3>Summary ({timeRange})</h3>
        <p>Total Cost: ${processedData.reduce((acc, day) => acc + day.totalCost, 0).toFixed(2)}</p>
      </div>
    </div>
  );
};

export default Dashboard;
