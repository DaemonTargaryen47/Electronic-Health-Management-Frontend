"use client";

import React, { useState, useEffect } from 'react';
import { getAppointmentAnalytics } from '@/services/doctorDashboardService';

const AppointmentChart = ({ period = 'month' }) => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointmentAnalytics();
  }, [period]);

  const fetchAppointmentAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getAppointmentAnalytics(period);
      
      if (response.success) {
        setAnalytics(response.analytics || []);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError('An error occurred while fetching analytics');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate the maximum value for scaling
  const maxValue = analytics.length > 0 
    ? Math.max(...analytics.map(item => item.total)) 
    : 0;

  // Format label based on period
  const formatLabel = (item) => {
    if (period === 'month') {
      // For daily view, show day number
      return new Date(item.date).getDate();
    } else {
      // For monthly view, show month abbreviation
      return item.month_name;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex h-[90%]">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 text-xs text-gray-500">
          <span>{maxValue}</span>
          <span>{Math.floor(maxValue * 0.75)}</span>
          <span>{Math.floor(maxValue * 0.5)}</span>
          <span>{Math.floor(maxValue * 0.25)}</span>
          <span>0</span>
        </div>
        
        {/* Chart */}
        <div className="flex-1">
          {/* Grid lines */}
          <div className="relative h-full">
            <div className="absolute w-full h-full flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-gray-200 w-full h-0"></div>
              ))}
            </div>
            
            {/* Chart bars */}
            <div className="relative h-full flex items-end">
              {analytics.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full px-1 flex justify-center space-x-1">
                    {/* Completed appointments bar */}
                    <div 
                      className="w-2 bg-success rounded-t" 
                      style={{ 
                        height: `${maxValue > 0 ? (item.completed / maxValue) * 100 : 0}%`,
                        minHeight: item.completed > 0 ? '4px' : '0' 
                      }}
                    ></div>
                    
                    {/* Virtual appointments bar */}
                    <div 
                      className="w-2 bg-info rounded-t" 
                      style={{ 
                        height: `${maxValue > 0 ? (item.virtual / maxValue) * 100 : 0}%`,
                        minHeight: item.virtual > 0 ? '4px' : '0'  
                      }}
                    ></div>
                    
                    {/* Total appointments bar */}
                    <div 
                      className="w-2 bg-primary rounded-t" 
                      style={{ 
                        height: `${maxValue > 0 ? (item.total / maxValue) * 100 : 0}%`,
                        minHeight: item.total > 0 ? '4px' : '0'  
                      }}
                    ></div>
                  </div>
                  
                  {/* X-axis label */}
                  <div className="text-xs mt-1 text-gray-500">
                    {formatLabel(item)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart legend */}
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-primary rounded-full mr-1"></div>
          <span className="text-xs">Total</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-success rounded-full mr-1"></div>
          <span className="text-xs">Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-info rounded-full mr-1"></div>
          <span className="text-xs">Virtual</span>
        </div>
      </div>
    </div>
  );
};

export default AppointmentChart;
