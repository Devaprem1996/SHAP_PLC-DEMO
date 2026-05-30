interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'accent' | 'secondary' | 'warning' | 'destructive';
}

const CircularProgress = ({ 
  percentage, 
  size = 100, 
  strokeWidth = 8, 
  color = 'accent' 
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColorClass = (color: string) => {
    switch (color) {
      case 'primary':
        return 'stroke-primary';
      case 'accent':
        return 'stroke-accent';
      case 'secondary':
        return 'stroke-secondary';
      case 'warning':
        return 'stroke-warning';
      case 'destructive':
        return 'stroke-destructive';
      default:
        return 'stroke-accent';
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg
        className="transform -rotate-90 w-full h-full"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Progress circle only - no background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={4}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getColorClass(color)}`}
        />
      </svg>
      
      {/* Percentage text - centered without container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-white">
          {percentage}%
        </span>
      </div>
    </div>
  );
};

export { CircularProgress };