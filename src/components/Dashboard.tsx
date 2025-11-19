import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import type { TimeRange, UsageEvent } from '../types';
import { processStats, getUniqueModels } from '../utils/statsService';
import { parseISO, startOfHour, isSameDay } from 'date-fns';

interface DashboardProps {
  data: UsageEvent[];
}

interface TimeslotSummary {
  timeslot: string;
  totalRequests: number;
  totalCost: number;
  averageCostPerRequest: number;
  requestsByModel: Record<string, { count: number; cost: number }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedTimeslot, setSelectedTimeslot] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const getTimeslotSummary = (timeslot: string): TimeslotSummary | null => {
    let filteredEvents: UsageEvent[] = [];

    if (timeRange === '1d') {
      // For hourly data, filter by hour
      const targetHour = parseISO(timeslot);
      filteredEvents = data.filter(event => {
        const eventDate = parseISO(event.date);
        const eventHour = startOfHour(eventDate);
        return eventHour.getTime() === targetHour.getTime();
      });
    } else {
      // For daily data, filter by day
      const targetDate = parseISO(timeslot);
      filteredEvents = data.filter(event => {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, targetDate);
      });
    }

    if (filteredEvents.length === 0) {
      return null;
    }

    const totalRequests = filteredEvents.length;
    const totalCost = filteredEvents.reduce((sum, event) => sum + event.cost, 0);
    const averageCostPerRequest = totalCost / totalRequests;

    const requestsByModel: Record<string, { count: number; cost: number }> = {};
    filteredEvents.forEach(event => {
      const model = event.model || 'Unknown';
      if (!requestsByModel[model]) {
        requestsByModel[model] = { count: 0, cost: 0 };
      }
      requestsByModel[model].count++;
      requestsByModel[model].cost += event.cost;
    });

    return {
      timeslot,
      totalRequests,
      totalCost,
      averageCostPerRequest,
      requestsByModel
    };
  };

  const handleBarClick = (data: any) => {
    if (data && data.date) {
      setSelectedTimeslot(data.date);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTimeslot(null);
  };

  const summary = selectedTimeslot ? getTimeslotSummary(selectedTimeslot) : null;

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
                onClick={handleBarClick}
              >
                {processedData.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Bar>
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

      {isModalOpen && summary && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>
                {timeRange === '1d' 
                  ? `Hour: ${summary.timeslot.substring(11, 13)}:00`
                  : `Date: ${summary.timeslot}`
                }
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '8px 0', fontSize: '16px' }}>
                <strong>Total Requests:</strong> {summary.totalRequests}
              </p>
              <p style={{ margin: '8px 0', fontSize: '16px' }}>
                <strong>Total Cost:</strong> ${summary.totalCost.toFixed(4)}
              </p>
              <p style={{ margin: '8px 0', fontSize: '16px', color: '#0088fe' }}>
                <strong>Average Cost per Request:</strong> ${summary.averageCostPerRequest.toFixed(4)}
              </p>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Breakdown by Model:</h3>
              {Object.entries(summary.requestsByModel).map(([model, stats], index) => (
                <div
                  key={model}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    borderLeft: `4px solid ${COLORS[index % COLORS.length]}`
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{model}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Requests: {stats.count} | Cost: ${stats.cost.toFixed(4)} | Avg: ${(stats.cost / stats.count).toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
