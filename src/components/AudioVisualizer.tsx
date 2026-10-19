import React, { useEffect, useRef } from 'react';
import { globalAudioEngine } from '../utils/audioEngine';

interface Props {
  isPlaying: boolean;
  className?: string;
  barColor?: string;
}

export const AudioVisualizer: React.FC<Props> = ({ isPlaying, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let idlePhase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = globalAudioEngine.getAnalyser();

      if (isPlaying && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barCount = 48;
        const barWidth = (width / barCount) - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] || 0;
          const percent = value / 255;
          const barHeight = Math.max(4, percent * height * 0.9);
          const x = i * (barWidth + 2);
          const y = (height - barHeight) / 2;

          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, '#38bdf8'); // sky blue
          gradient.addColorStop(0.5, '#6366f1'); // indigo
          gradient.addColorStop(1, '#ec4899'); // pink

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 2, 2]);
          ctx.fill();
        }
      } else {
        // Subtle ambient idle wave
        idlePhase += 0.04;
        const barCount = 48;
        const barWidth = (width / barCount) - 2;

        for (let i = 0; i < barCount; i++) {
          const sinVal = Math.sin(idlePhase + (i * 0.25));
          const barHeight = 4 + Math.abs(sinVal) * 8;
          const x = i * (barWidth + 2);
          const y = (height - barHeight) / 2;

          ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 2, 2]);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm ${className}`}>
      <canvas
        ref={canvasRef}
        width={480}
        height={60}
        className="w-full h-full block"
      />
    </div>
  );
};
