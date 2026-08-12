import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PlcCard from "@/components/PlcCard";
import { ArrowLeft, Filter, RotateCcw, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { webhookService } from "@/services/webhookService";

type PLCData = {
  id: string;
  stationName: string;
  status: 'normal' | 'abnormal' | 'warning' | 'unknown';
  total: number;
  normal: number;
  abnormal: number;
  efficiency?: number;
  percentage?: number;
  systemType?: string;
  lastUpdated: Date;
  icon?: string;
  additionalData?: Record<string, unknown>;
  dynamicData?: Record<string, unknown>;
  [key: string]: unknown;
};

const tableNames = [
  'AY_SP3i_DASH_LINE_LIVE',
  'AY_SP3I_SMBR_LH_LINE_LIVE',
  'AY_SP3I_SMBR_RH_LINE_LIVE',
  'AY_SP3I_SOTR_LH_LINE_LIVE',
  'AY_SP3I_SOTR_RH_LINE_LIVE'
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [plcData, setPLCData] = useState<PLCData[]>([]);
  const [filterColumn, setFilterColumn] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('30sec');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [currentDisplayTable, setCurrentDisplayTable] = useState<string>('');
  const [currentlyFetchingTable, setCurrentlyFetchingTable] = useState<string>('');
  const [lineFontSize, setLineFontSize] = useState('text-4xl');
  const lineNameRef = useRef<HTMLSpanElement>(null);

  // Specific table names to filter by
  const tableCount = tableNames.length;

  // Time intervals for sorting
  const timeIntervals = [{
    value: '30sec',
    label: '30 seconds'
  }, {
    value: '1min',
    label: '1 minute'
  }, {
    value: '5min',
    label: '5 minutes'
  }, {
    value: '15min',
    label: '15 minutes'
  }, {
    value: '30min',
    label: '30 minutes'
  }, {
    value: '60min',
    label: '60 minutes'
  }];

  // Fetch data from local n8n webhook with retry logic for ALL mode rotation
  const fetchWebhookData = useCallback(async (tableName?: string, timeInterval?: string, retryAttempt = 0) => {
    console.log(`🔄 [ROTATION] Starting fetch - Mode: ${tableName}, Interval: ${timeInterval}, Retry: ${retryAttempt}`);
    
    setIsLoading(true);
    setError(null);
    
    // Determine which table to fetch
    let targetTable = tableName;
    if (tableName === 'all') {
      targetTable = tableNames[currentTableIndex];
      console.log(`🎯 [ROTATION] ALL mode - Fetching table ${currentTableIndex + 1}/${tableNames.length}: ${targetTable}`);
      setCurrentDisplayTable(targetTable);
    } else if (tableName && tableName !== 'all') {
      console.log(`📍 [ROTATION] Single table mode - Fetching: ${tableName}`);
      setCurrentDisplayTable(tableName);
    }
    
    try {
      console.log(`⏱️ [ROTATION] Fetching data from ${targetTable} at ${new Date().toLocaleTimeString()}`);
      
      // Fetch data directly from local n8n webhook
      const response = await webhookService.fetchData(targetTable, timeInterval);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch data from n8n webhook');
      }

      const responseData = response.data ?? [];
      const transformedData = Array.isArray(responseData)
        ? responseData.map((item: Record<string, unknown>) => ({
            ...item,
            lastUpdated: item.lastUpdated ? new Date(String(item.lastUpdated)) : new Date()
          })) as PLCData[]
        : [];
      console.log(`✅ [ROTATION] Successfully fetched ${transformedData.length} items from ${targetTable}`);
      
      // Update data and UI state
      setPLCData(transformedData);
      setLastUpdate(new Date());
      setIsConnected(true);
      setRetryCount(0);
      setError(null);
      
    } catch (error) {
      console.error(`❌ [ROTATION] Failed to fetch from ${targetTable}:`, error);
      setIsConnected(false);
      setError(error instanceof Error ? error.message : 'Failed to fetch data from n8n webhook');

      // Retry logic
      if (retryAttempt < 2) {
        console.log(`🔁 [ROTATION] Retrying fetch for ${targetTable} in ${2000 * (retryAttempt + 1)}ms (attempt ${retryAttempt + 1}/3)`);
        setTimeout(() => {
  setRetryCount(retryAttempt + 1);
  fetchWebhookData(tableName, timeInterval, retryAttempt + 1);
}, 2000 * (retryAttempt + 1));
      } else {
        console.error(`💀 [ROTATION] Max retries reached for ${targetTable}. Giving up.`);
        setPLCData([]);
        setError('Failed to fetch data after multiple attempts. Please check your n8n webhook connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentTableIndex]);

  // Dynamic font sizing for line name
  const adjustLineNameFontSize = () => {
    if (!lineNameRef.current) return;

    const container = lineNameRef.current.parentElement;
    if (!container) return;

    const containerWidth = container.offsetWidth - 32; // Account for padding
    const fontSizes = [
      'text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm'
    ];
    
    // Reset to largest size first
    lineNameRef.current.className = `${fontSizes[0]} font-bold text-white text-center leading-tight whitespace-nowrap`;
    
    // Check if text fits, if not reduce font size
    for (let i = 0; i < fontSizes.length; i++) {
      lineNameRef.current.className = `${fontSizes[i]} font-bold text-white text-center leading-tight whitespace-nowrap`;
      
      if (lineNameRef.current.scrollWidth <= containerWidth) {
        setLineFontSize(fontSizes[i]);
        break;
      }
      
      // If we're at the smallest size, use it regardless
      if (i === fontSizes.length - 1) {
        setLineFontSize(fontSizes[i]);
      }
    }
  };

  // Adjust font size when display table changes or window resizes
  useEffect(() => {
    adjustLineNameFontSize();
    
    const handleResize = () => {
      setTimeout(adjustLineNameFontSize, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentDisplayTable, filterColumn]);

  // Handle filter changes
  const handleFilterChange = (value: string) => {
    console.log(`🔄 [ROTATION] Filter changed from '${filterColumn}' to '${value}'`);
    
    setFilterColumn(value);
    
    // Reset table index when changing filters
    if (value === 'all') {
      console.log(`🔄 [ROTATION] Switching to ALL mode - Resetting rotation to index 0`);
      setCurrentTableIndex(0);
      const firstTableName = tableNames[0];
      setCurrentDisplayTable(firstTableName);
      console.log(`🎯 [ROTATION] Set initial display table to: ${firstTableName}`);
    } else {
      console.log(`📍 [ROTATION] Switching to single table mode: ${value}`);
      setCurrentDisplayTable(value);
    }
    
    // Always call webhook when filter changes
    fetchWebhookData(value, sortBy);
  };

  // Handle sort changes
  const handleSortChange = (value: string) => {
    console.log(`⏱️ [ROTATION] Refresh interval changed from '${sortBy}' to '${value}'`);
    setSortBy(value);
    // Always call webhook when time interval changes
    fetchWebhookData(filterColumn, value);
  };

  // Get all column names for filter dropdown - now only specific table names
  const getAvailableColumns = () => {
    return tableNames;
  };

  // Filter and sort data - show all webhook column data
  const filteredData = plcData
    .filter(item => item && item.id && item.stationName && item.status)
    .sort((a, b) => {
      const dateA = new Date(a.lastUpdated);
      const dateB = new Date(b.lastUpdated);
      return dateB.getTime() - dateA.getTime();
    });
const getRefreshInterval = useCallback(() => {
  switch (sortBy) {
    case '30sec':
      return 30000;
    case '1min':
      return 60000;
    case '5min':
      return 300000;
    case '15min':
      return 900000;
    case '30min':
      return 1800000;
    case '60min':
      return 3600000;
    default:
      return 30000;
  }
}, [sortBy]);
  // Initial data load and periodic refresh with ALL mode rotation
  useEffect(() => {
  fetchWebhookData(filterColumn, sortBy);

  const interval = setInterval(() => {
    if (filterColumn === 'all') {
      setCurrentTableIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % tableNames.length;

        fetchWebhookData('all', sortBy);

        return nextIndex;
      });
    } else {
      fetchWebhookData(filterColumn, sortBy);
    }
    }, getRefreshInterval());

    return () => clearInterval(interval);
  }, [filterColumn, sortBy, fetchWebhookData, getRefreshInterval, tableCount]);

  const getStatusCounts = () => {
    const normal = filteredData.filter(item => item.status === 'normal').length;
    const warning = filteredData.filter(item => item.status === 'warning').length;
    const abnormal = filteredData.filter(item => item.status === 'abnormal').length;
    return {
      normal,
      warning,
      abnormal
    };
  };
  const statusCounts = getStatusCounts();
  return <div className="min-h-screen bg-gradient-bg bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-gradient-glass backdrop-blur-md">
        <div className="w-full px-2 py-4">
            <div className="grid grid-cols-[minmax(200px,auto)_1fr_minmax(300px,auto)] items-center gap-4">
            {/* Left: Back + Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="glass" size="sm" onClick={() => navigate('/')} className="gap-2 flex-shrink-0">
                <ArrowLeft size={16} />
                Back
              </Button>
              <div className="hidden lg:flex flex-col leading-tight min-w-0">
                <h1 className="text-xl font-bold text-primary glow-text whitespace-nowrap shadow-glow-primary">PLC Monitor</h1>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Real-time industrial data dashboard</p>
              </div>
            </div>

            {/* Center - Selected Table Name Only */}
            <div className="flex items-center justify-center min-w-0 px-4 flex-1">
              <span 
                ref={lineNameRef}
                className={`${lineFontSize} font-bold text-white text-center leading-tight whitespace-nowrap`}
              >
                {filterColumn === 'all' ? (
                  currentDisplayTable || tableNames[0]
                ) : (
                  filterColumn
                )}
              </span>
            </div>

            {/* Right: Filters and Last Update */}
            <div className="flex items-center justify-end gap-2 lg:gap-4 flex-shrink-0 min-w-0">
              {/* Filter Dropdown */}
              <div className="flex items-center gap-1 lg:gap-2">
                <Filter size={14} className="text-muted-foreground hidden sm:block" />
                <span className="text-xs text-muted-foreground hidden md:block">Filter:</span>
                <Select value={filterColumn} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-32 lg:w-40 h-8 text-xs bg-card border-border text-foreground">
                    <SelectValue placeholder="Select table..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-lg z-50">
                    <SelectItem value="all">ALL</SelectItem>
                    {getAvailableColumns().map(column => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Interval Dropdown */}
              <div className="flex items-center gap-1 lg:gap-2">
                <RotateCcw size={14} className="text-muted-foreground hidden sm:block" />
                <span className="text-xs text-muted-foreground hidden md:block">Refresh:</span>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-20 lg:w-28 h-8 text-xs bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-lg z-50">
                    {timeIntervals.map(interval => (
                      <SelectItem key={interval.value} value={interval.value}>
                        {interval.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Last Update */}
              <span className="text-xs text-muted-foreground hidden lg:block">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-1 py-2 h-[calc(100vh-120px)]">
        {/* Cards Grid - Single row layout responsive to screen size */}
        <div className="grid gap-1 sm:gap-2 lg:gap-3 xl:gap-4 2xl:gap-6 w-full h-full" 
             style={{
               gridTemplateColumns: `repeat(${Math.min(filteredData.length || 7, window.innerWidth > 3840 ? 12 : window.innerWidth > 2560 ? 10 : window.innerWidth > 1920 ? 8 : 7)}, minmax(0, 1fr))`
             }}>
          {filteredData.map(item => <div key={item.id} className="animate-fade-in-up min-w-0 h-full">
              <PlcCard data={item} />
            </div>)}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Activity size={16} className="animate-spin" />
                  {currentlyFetchingTable ? (
                    <>Loading data from {currentlyFetchingTable}...</>
                  ) : (
                    <>Loading data...</>
                  )}
                </div>
              ) : error ? (
                <div className="space-y-2">
                  <p>Failed to load data from webhook</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                <p>No data available for the selected filter</p>
              )}
            </div>
          </div>
        )}
      </main>

    </div>;
};
export default Dashboard;