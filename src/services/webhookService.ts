// Local n8n webhook service for PLC data fetching

export interface WebhookResponse {
  success: boolean;
  data: any[];
  error?: string;
}

export interface PlcDataItem {
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
  dynamicData?: Record<string, any>;
  additionalData?: Record<string, any>;
}

class WebhookService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or fallback to localhost
    this.baseUrl = import.meta.env?.VITE_N8N_WEBHOOK_URL || 'http://192.10.90.230:5678/webhook/sha/fetchdata';
  }

  // Map system names to icons (moved from edge function)
  private getSystemIcon(systemKey: string): string {
    const systemMappings: Record<string, string> = {
      'VisionSystem': 'Eye',
      'WeldCount': 'Zap', 
      'WaterBypass': 'Bot',
      'ATDRotation': 'Truck',
      'HardwareSensor': 'Radar',
      'Hardware': 'Server',
      'SafetySystem': 'Network',
      'Safety': 'Shield'
    };
    return systemMappings[systemKey] || 'Activity';
  }

  // Determine overall status based on counts (moved from edge function)
  private getOverallStatus(normal: number, abnormal: number, warning: number): 'normal' | 'abnormal' | 'warning' | 'unknown' {
    if (abnormal > 0) return 'abnormal';
    if (warning > 0) return 'warning';
    if (normal > 0) return 'normal';
    return 'unknown';
  }

  // Transform raw n8n data to PlcCard format (moved from edge function)
  private transformWebhookData(rawData: any[]): PlcDataItem[] {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }

    // Group data by system prefixes (e.g., VisionSystem, WeldCount, etc.)
    const systemGroups: Record<string, any> = {};
    
    rawData.forEach(item => {
      if (!item || typeof item !== 'object') return;
      
      Object.keys(item).forEach(key => {
        if (key === 'date_time') return; // Skip timestamp field
        
        const parts = key.split('_');
        if (parts.length < 2) return;
        
        const systemName = parts[0];
        const metricType = parts.slice(1).join('_');
        
        if (!systemGroups[systemName]) {
          systemGroups[systemName] = {
            date_time: item.date_time
          };
        }
        
        systemGroups[systemName][metricType] = item[key];
      });
    });

    // Convert grouped data to PlcCard format
    const transformedData: PlcDataItem[] = [];
    let systemIndex = 1;

    Object.entries(systemGroups).forEach(([systemName, data]) => {
      const total = parseInt(data.Total) || 0;
      const normal = parseInt(data.Normal) || 0;
      const abnormal = parseInt(data.Abnormal) || 0;
      const efficiency = parseFloat(data.Efficiency) || 0;
      const warning = parseInt(data.Warning) || 0;
      const stationError = data.STATION_ERROR;

      const status = this.getOverallStatus(normal, abnormal, warning);
      const icon = this.getSystemIcon(systemName);

      const plcItem: PlcDataItem = {
        id: `${systemIndex}-${systemName}`,
        stationName: systemName,
        status,
        total,
        normal,
        abnormal,
        efficiency,
        percentage: efficiency,
        systemType: systemName,
        lastUpdated: data.date_time ? new Date(data.date_time) : new Date(),
        icon,
        dynamicData: {
          TOTAL: total,
          NORMAL: normal,
          ABNORMAL: abnormal,
          EFFICIENCY: efficiency,
          ...(stationError !== undefined && { STATION_ERROR: stationError })
        },
        additionalData: {
          ...(stationError !== undefined && { stationError })
        }
      };

      transformedData.push(plcItem);
      systemIndex++;
    });

    return transformedData;
  }

  // Fetch data from local n8n webhook
  async fetchData(tableFilter?: string, timeInterval?: string): Promise<WebhookResponse> {
    try {
      console.log(`🔗 [N8N] Fetching from ${this.baseUrl} - Table: ${tableFilter}, Interval: ${timeInterval}`);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: tableFilter,
          interval: timeInterval
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      console.log(`✅ [N8N] Raw response received:`, rawData);

      // Transform the data to match PlcCard format
      const transformedData = this.transformWebhookData(Array.isArray(rawData) ? rawData : [rawData]);
      
      console.log(`🔄 [N8N] Transformed ${transformedData.length} items`);

      return {
        success: true,
        data: transformedData
      };

    } catch (error) {
      console.error('❌ [N8N] Webhook fetch failed:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const webhookService = new WebhookService();