import { useEffect, useRef } from 'react';

type RadarChartProps = {
  data: Array<{
    label: string;
    value: number; // 0-100
  }>;
  maxValue?: number;
};

export default function RadarChart({ data, maxValue = 100 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;
    const levels = 5;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background circles (levels)
    for (let i = 1; i <= levels; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / levels, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axes
    const angleStep = (2 * Math.PI) / data.length;
    data.forEach((_, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw data polygon
    ctx.beginPath();
    data.forEach((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = Math.min(item.value, maxValue);
      const distance = (value / maxValue) * radius;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    data.forEach((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = Math.min(item.value, maxValue);
      const distance = (value / maxValue) * radius;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    });

    // Draw labels
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#374151';

    data.forEach((item, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const labelDistance = radius + 30;
      let x = centerX + labelDistance * Math.cos(angle);
      let y = centerY + labelDistance * Math.sin(angle);

      // Adjust text alignment based on position
      if (Math.abs(x - centerX) < 5) {
        ctx.textAlign = 'center';
      } else if (x > centerX) {
        ctx.textAlign = 'left';
      } else {
        ctx.textAlign = 'right';
      }

      // Split long labels
      const words = item.label.split(' ');
      if (words.length > 2) {
        ctx.fillText(words.slice(0, 2).join(' '), x, y - 6);
        ctx.fillText(words.slice(2).join(' '), x, y + 6);
      } else {
        ctx.fillText(item.label, x, y);
      }

      // Draw value
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`${Math.round(item.value)}%`, x, y + (words.length > 2 ? 18 : 12));
      ctx.font = '12px sans-serif';
    });

  }, [data, maxValue]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  );
}

