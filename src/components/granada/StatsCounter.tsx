import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        setCount(Math.floor(end * progress));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isVisible]);

  return { count, ref };
}

export function StatCounter({ end, duration, suffix = "", prefix = "" }: StatCounterProps) {
  const { count, ref } = useCountUp(end, duration);

  return (
    <div ref={ref}>
      <span className="text-4xl md:text-5xl font-bold text-primary">
        {prefix}{count}{suffix}
      </span>
    </div>
  );
}

interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}

interface StatsCounterProps {
  stats: Stat[];
}

export default function StatsCounter({ stats }: StatsCounterProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <StatCounter
            end={stat.value}
            suffix={stat.suffix}
            prefix={stat.prefix}
            duration={2000}
          />
          <p className="mt-2 text-muted-foreground font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
