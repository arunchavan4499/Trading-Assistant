import { cn } from '@/lib/utils';

interface HeatmapProps {
  data: number[][];
  labels: string[];
  height?: number;
  colorScale?: { min: string; mid: string; max: string };
}

export function Heatmap({ data, labels, height = 400, colorScale }: HeatmapProps) {
  const colors = colorScale || { min: '#ef4444', mid: '#fbbf24', max: '#10b981' };

  const getColor = (value: number, min: number, max: number) => {
    const normalized = (value - min) / (max - min);
    if (normalized < 0.5) {
      return interpolateColor(colors.min, colors.mid, normalized * 2);
    } else {
      return interpolateColor(colors.mid, colors.max, (normalized - 0.5) * 2);
    }
  };

  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const flatData = data.flat();
  const min = Math.min(...flatData);
  const max = Math.max(...flatData);

  const cellSize = Math.min(50, height / data.length);

  return (
    <div className="overflow-auto">
      <div style={{ minWidth: labels.length * cellSize }}>
        <div className="flex mb-2">
          <div style={{ width: cellSize }} />
          {labels.map((label, i) => (
            <div key={i} className="text-xs text-center" style={{ width: cellSize }}>
              {label}
            </div>
          ))}
        </div>
        {data.map((row, i) => (
          <div key={i} className="flex">
            <div className="text-xs flex items-center pr-2" style={{ width: cellSize }}>
              {labels[i]}
            </div>
            {row.map((value, j) => (
              <div
                key={j}
                className={cn('border border-border flex items-center justify-center text-xs font-mono')}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: getColor(value, min, max),
                  color: value > (min + max) / 2 ? '#fff' : '#000',
                }}
                title={`${labels[i]} × ${labels[j]}: ${value.toFixed(4)}`}
              >
                {value.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
