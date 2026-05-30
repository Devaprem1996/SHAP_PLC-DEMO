import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/CircularProgress";
import { 
  Eye, 
  Zap, 
  Bot, 
  Truck, 
  Radar, 
  Server, 
  Network, 
  Database, 
  Monitor, 
  Cpu, 
  HardDrive, 
  Thermometer, 
  Fan, 
  Activity,
  Settings,
  Shield
} from "lucide-react";

interface PlcData {
  id: string;
  stationName: string;
  status: 'normal' | 'abnormal' | 'warning' | 'unknown';
  total: number;
  normal: number;
  abnormal: number;
  efficiency?: number;
  systemType?: string;
  percentage?: number;
  lastUpdated?: Date;
  icon?: string;
  additionalData?: Record<string, any>;
  dynamicData?: Record<string, any>;
}

interface PlcCardProps {
  data: PlcData;
}

const PlcCard = ({ data }: PlcCardProps) => {
  // Map icon names to actual icon components
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'Eye': Eye,
      'Zap': Zap,
      'Bot': Bot,
      'Truck': Truck,
      'Radar': Radar,
      'Server': Server,
      'Network': Network,
      'Database': Database,
      'Monitor': Monitor,
      'Cpu': Cpu,
      'HardDrive': HardDrive,
      'Thermometer': Thermometer,
      'Fan': Fan,
      'Activity': Activity,
      'Settings': Settings,
      'Shield': Shield
    };
    return iconMap[iconName] || Activity;
  };

  const IconComponent = getIconComponent(data.icon || 'Activity');

  const getIconColor = () => {
    const systemId = data.id.split('-')[0]; // Use dash separator since edge function uses dash
    switch (systemId) {
      case '1': return 'text-blue-400'; // VisionSystem
      case '2': return 'text-yellow-400'; // WeldCount
      case '3': return 'text-cyan-400'; // WaterBypass
      case '4': return 'text-purple-400'; // ATDRotation
      case '5': return 'text-green-400'; // HardwareSensor
      case '6': return 'text-orange-400'; // Hardware
      case '7': return 'text-red-400'; // SafetySystem
      case '8': return 'text-pink-400'; // Safety
      default: return 'text-primary';
    }
  };

  const getIconBackground = () => {
    const systemId = data.id.split('-')[0]; // Use dash separator since edge function uses dash
    switch (systemId) {
      case '1': return 'bg-blue-500/20'; // VisionSystem
      case '2': return 'bg-yellow-500/20'; // WeldCount
      case '3': return 'bg-cyan-500/20'; // WaterBypass
      case '4': return 'bg-purple-500/20'; // ATDRotation
      case '5': return 'bg-green-500/20'; // HardwareSensor
      case '6': return 'bg-orange-500/20'; // Hardware
      case '7': return 'bg-red-500/20'; // SafetySystem
      case '8': return 'bg-pink-500/20'; // Safety
      default: return 'bg-primary/20';
    }
  };

  // Extract specific fields from dynamic data and edge function payload
  const totalValue = data.dynamicData?.TOTAL ?? data.total ?? 0;
  const normalValue = data.dynamicData?.NORMAL ?? data.normal ?? 0;
  const abnormalValue = data.dynamicData?.ABNORMAL ?? data.abnormal ?? 0;
  const efficiencyValue = data.dynamicData?.EFFICIENCY ?? data.efficiency ?? data.percentage ?? 0;
  const stationError = data.dynamicData?.STATION_ERROR ?? data.additionalData?.stationError;

  return (
    <Card className="bg-gray-900 border-gray-700 w-full h-full">
      <CardContent className="p-2 sm:p-3 lg:p-4 xl:p-5 2xl:p-6 flex flex-col justify-between h-full">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`w-6 sm:w-8 md:w-10 lg:w-12 xl:w-14 2xl:w-16 h-6 sm:h-8 md:h-10 lg:h-12 xl:h-14 2xl:h-16 rounded-full ${getIconBackground()} flex items-center justify-center`}>
            <IconComponent className={`w-3 sm:w-4 md:w-5 lg:w-6 xl:w-7 2xl:w-8 h-3 sm:h-4 md:h-5 lg:h-6 xl:h-7 2xl:h-8 ${getIconColor()}`} />
          </div>
        </div>

        {/* System Name as Heading */}
        <h3 className="text-white font-semibold text-center text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl leading-tight px-1 whitespace-nowrap text-ellipsis overflow-hidden">
          {data.stationName}
        </h3>

        {/* Circular Progress - showing efficiency */}
        <div className="flex justify-center">
          <CircularProgress 
            percentage={efficiencyValue}
            color="accent"
            size={window.innerWidth > 3840 ? 80 : window.innerWidth > 2560 ? 70 : window.innerWidth > 1920 ? 60 : 48}
          />
        </div>

        {/* Fixed Layout: TOTAL, NORMAL, ABNORMAL, STATION ERROR */}
        <div className="space-y-1 flex-1 flex flex-col justify-evenly">
          {/* TOTAL */}
          <div className="bg-gray-900/50 rounded px-1 sm:px-2 lg:px-3 xl:px-4 py-1 sm:py-2">
            <div className="text-yellow-400 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold mb-1 text-center">TOTAL</div>
            <div className="text-primary text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-center shadow-glow-primary">
              {typeof totalValue === 'number' ? totalValue.toLocaleString() : String(totalValue)}
            </div>
          </div>

          {/* NORMAL */}
          <div className="bg-gray-900/50 rounded px-1 sm:px-2 lg:px-3 xl:px-4 py-1 sm:py-2">
            <div className="text-yellow-400 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold mb-1 text-center">NORMAL</div>
            <div className="text-accent text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-center shadow-glow-accent">
              {typeof normalValue === 'number' ? normalValue.toLocaleString() : String(normalValue)}
            </div>
          </div>

          {/* ABNORMAL */}
          <div className="bg-gray-900/50 rounded px-1 sm:px-2 lg:px-3 xl:px-4 py-1 sm:py-2">
            <div className="text-yellow-400 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold mb-1 text-center">ABNORMAL</div>
            <div className="text-red-500 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-center">
              {typeof abnormalValue === 'number' ? abnormalValue.toLocaleString() : String(abnormalValue)}
            </div>
          </div>

          {/* STATION ERROR - only show if exists */}
          {stationError !== undefined && stationError !== null && (
            <div className="bg-gray-900/50 rounded px-1 sm:px-2 lg:px-3 xl:px-4 py-1 sm:py-2">
              <div className="text-yellow-400 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold mb-1 text-center">STATION ERROR</div>
              <div className="text-warning text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-center shadow-glow-warning">
                {String(stationError)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlcCard;