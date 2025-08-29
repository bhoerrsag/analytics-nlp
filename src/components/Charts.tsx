'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  [key: string]: string | number;
}

interface ChartProps {
  data: ChartData[];
  title?: string;
  type: 'line' | 'area' | 'bar' | 'pie';
  xKey: string;
  yKey: string | string[];
  colors?: string[];
}

const DEFAULT_COLORS = ['#000000', '#666666', '#999999', '#cccccc', '#e5e5e5'];

export function AnalyticsChart({ data, title, type, xKey, yKey, colors = DEFAULT_COLORS }: ChartProps) {
  const chartHeight = 300;
  
  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-xs">
          <p className="font-semibold text-black">{props.label}</p>
          {props.payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-xs">
              {`${entry.dataKey}: ${entry.value?.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#cccccc' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#cccccc' }}
            />
            <Tooltip content={renderTooltip} />
            {Array.isArray(yKey) ? (
              yKey.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={yKey}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#cccccc' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#cccccc' }}
            />
            <Tooltip content={renderTooltip} />
            {Array.isArray(yKey) ? (
              yKey.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                />
              ))
            ) : (
              <Area
                type="monotone"
                dataKey={yKey}
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.3}
              />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#cccccc' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#666666' }}
              axisLine={{ stroke: '#cccccc' }}
            />
            <Tooltip content={renderTooltip} />
            {Array.isArray(yKey) ? (
              yKey.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                />
              ))
            ) : (
              <Bar
                dataKey={yKey}
                fill={colors[0]}
              />
            )}
          </BarChart>
        );

      case 'pie':
        const pieData = data.map((item, index) => ({
          ...item,
          fill: colors[index % colors.length]
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => 
                `${name}: ${value?.toLocaleString()} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey={yKey as string}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="my-4 p-4 bg-white border border-gray-200 rounded-lg">
      {title && (
        <h3 className="text-sm font-semibold text-black mb-3">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}