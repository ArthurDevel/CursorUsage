import type { UsageEvent, DailyStat, TimeRange } from '../types';
import { subDays, parseISO, isAfter, startOfDay, startOfHour, format, eachHourOfInterval, eachDayOfInterval } from 'date-fns';
// import _ from 'lodash';
import groupBy from 'lodash/groupBy';
import sum from 'lodash/sum';
import mapValues from 'lodash/mapValues';

export const processStats = (data: UsageEvent[], range: TimeRange): DailyStat[] => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;
  
  if (range === '1d') {
    // For 1 day, get last 24 hours from now
    startDate = startOfHour(subDays(now, 1));
    endDate = now;
  } else {
    // For 7d and 30d, get full days including today
    // Subtract (days - 1) to include today in the count
    const daysToSubtract = range === '7d' ? 6 : 29;
    startDate = subDays(startOfDay(now), daysToSubtract);
    endDate = startOfDay(now);
  }

  // 1. Filter by date range
  const filteredData = data.filter(item => {
    const itemDate = parseISO(item.date);
    if (range === '1d') {
      return isAfter(itemDate, startDate) || itemDate.getTime() === startDate.getTime();
    } else {
      // For daily views, include all data from startDate onwards up to now
      return (isAfter(itemDate, startDate) || itemDate.getTime() === startDate.getTime()) && 
             itemDate.getTime() <= now.getTime();
    }
  });

  // 2. Group by Date or Hour based on range
  const groupKey = range === '1d' 
    ? (item: UsageEvent) => format(startOfHour(parseISO(item.date)), 'yyyy-MM-ddTHH')
    : (item: UsageEvent) => format(parseISO(item.date), 'yyyy-MM-dd');
  
  const groupedData = groupBy(filteredData, groupKey);

  // 3. Get all unique models from the data
  const allModels = new Set<string>();
  filteredData.forEach(item => {
    if (item.model) {
      allModels.add(item.model);
    }
  });

  // 4. Generate full time range
  const allPeriods: string[] = [];
  if (range === '1d') {
    // Generate all hours for the last 24 hours
    const hours = eachHourOfInterval({ start: startDate, end: endDate });
    hours.forEach(hour => {
      allPeriods.push(format(startOfHour(hour), 'yyyy-MM-ddTHH'));
    });
  } else {
    // Generate all days for the selected range (including today)
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    days.forEach(day => {
      allPeriods.push(format(day, 'yyyy-MM-dd'));
    });
  }

  // 5. Create stats for all periods, filling missing ones with zeros
  const stats: DailyStat[] = allPeriods.map(timeStr => {
    const items = groupedData[timeStr] || [];
    const modelCosts: Record<string, number> = {};
    
    // Initialize all models with 0
    allModels.forEach(model => {
      modelCosts[model] = 0;
    });

    // Add actual costs
    items.forEach(item => {
      const model = item.model || 'Unknown';
      modelCosts[model] = (modelCosts[model] || 0) + item.cost;
    });

    const totalCost = sum(Object.values(modelCosts));

    return {
      date: timeStr,
      totalCost: parseFloat(totalCost.toFixed(4)),
      ...mapValues(modelCosts, (val) => parseFloat(val.toFixed(4)))
    };
  });

  // 6. Sort by date ascending
  return stats.sort((a, b) => a.date.localeCompare(b.date));
};

export const getUniqueModels = (data: DailyStat[]): string[] => {
  const keys = new Set<string>();
  data.forEach(day => {
    Object.keys(day).forEach(key => {
      if (key !== 'date' && key !== 'totalCost') {
        keys.add(key);
      }
    });
  });
  return Array.from(keys);
};
