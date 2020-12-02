import { ResourceSelection } from '@sevone/insight-connect';

type ResourceSelectionType = React.ComponentProps<typeof ResourceSelection>;

type SelectResourceType = ResourceSelectionType['value'];

type ResourceHierarchicalDataType = Array<SelectResourceType>;

export type OptionType = { label: string, value: string };

export type RelativeTimeSpanType = {
  type: 'RELATIVE',
  relative: {
    range: string
  }
};

export type SpecificTimeSpanType = {
  type: 'SPECIFIC_INTERVAL',
  specificInterval: {
    start: number,
    end: number
  }
};

export type CustomRelativeTimeSpanType = {
  type: 'CUSTOM_RELATIVE',
  customRelative: {
    timeString: string
  }
}

export type TimeSpanType = RelativeTimeSpanType | SpecificTimeSpanType | CustomRelativeTimeSpanType;

export type ResourceType = {
  type: 'INDICATOR_TYPE' | 'OBJECT' | 'OBJECT_TYPE' | 'DEVICE' | 'PLUGIN' | 'DEVICE_GROUP' | 'OBJECT_GROUP'
  value: number
  plugin?: number
  objectType?: number
  pluginValue?: number
  deviceValue?: number
  objectValue?: number
  hierarchicalData: ResourceHierarchicalDataType
}

export type WidgetColumnType = {
  name: string
  label: string
  width?: string
  selected: boolean
  displayName?: string,
  optGroup?: string
}

export type StandardLegendPositionType = 'top' | 'left' | 'bottom' | 'right';

export type LineSettingsType = {
  title: {
    title: string
    showTitle: boolean
    subtitle: string
    showSubtitle: boolean
  },
  yAxis: {
    min: string,
    max: string,
    invertYAxis: boolean,
    lockZero: boolean,
    invertIndicators: Array<string>
    dualY: boolean
  },
  smooth: boolean,
  area: boolean,
  symbols: {
    symbolSize: number,
    symbol: string,
  },
  tooltip: {
    show: boolean,
    columns: Array<string>,
    format: boolean,
    showCross: boolean
  },
  showSymbol: boolean
}

export type VizSettingsType = {
  line: LineSettingsType
}

export type ConfigurationType = {
  visualization: string
  datasourceId: null | number
  resources: Array<ResourceType>
  timeSpan: TimeSpanType
  timeZone: string
  percentage: boolean
  selectedObject: string
  vizSettings: VizSettingsType
}

export default {
  visualization: 'Line',
  datasourceId: null,
  resources: [],
  selectedObject: null,
  timeSpan: {
    type: 'RELATIVE',
    relative: { range: 'PAST_24HOURS' }
  },
  timeZone: 'America/New_York',
  percentage: false,
  vizSettings:  {
    line: {
      title: {
        title: '',
        showTitle: false,
        subtitle: '',
        showSubtitle: false
      },
      yAxis: {
        min: '',
        max: '',
        invertYAxis: false,
        lockZero: false,
        invertIndicators: [],
        dualY: false
      },
      smooth: false,
      area: false,
      tooltip: {
        show: true,
        columns: [ 'value', 'timestamp', 'deviceName', 'indicatorName', 'objectName' ],
        format: true,
        showCross: true
      },
      showSymbol: true // new
    }
  }
};