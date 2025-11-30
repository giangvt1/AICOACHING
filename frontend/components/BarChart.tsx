type BarChartProps = {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  maxValue?: number;
  height?: number;
};

export default function BarChart({ data, maxValue, height = 200 }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 100);

  return (
    <div className="w-full">
      <div className="flex items-end justify-around gap-2" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const barHeight = (item.value / max) * height;
          const color = item.color || '#3b82f6';
          
          return (
            <div key={idx} className="flex flex-col items-center flex-1 max-w-[100px]">
              <div className="text-sm font-semibold mb-1 text-gray-700">
                {item.value}
              </div>
              <div 
                className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                style={{ 
                  height: `${barHeight}px`,
                  backgroundColor: color,
                  minHeight: '4px'
                }}
              />
              <div className="text-xs text-gray-600 mt-2 text-center break-words w-full">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

