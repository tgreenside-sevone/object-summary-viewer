import get from 'lodash-es/get';
import findLast from 'lodash-es/findLast';
import maxBy from 'lodash-es/maxBy';
import { messages } from '@sevone/insight-wdk';
import {
  calculateTimeRange,
  abbreviateValue,
  getTimeStringFromTimestamp
} from '@sevone/insight-widget-components';
import {
  IndicatorType,
  IndicatorDataType,
  MetadataType,
  GraphQLErrorType
} from '../../fetch-data';
import {
  ConfigurationType,
  LegendColumnType,
  ThresholdsType
} from '../../default-configuration';
import { TABLE_COLUMNS } from './columns';

export const handleLegendReorder = (
  order: string[],
  legendSelectedColumns: Array<LegendColumnType>,
  onMessage: (message: string, payload: any) => void
) => {
  const newCols = [];
  order.forEach((colId) => {
    const targetCol = legendSelectedColumns.find((legCol) => legCol.name === colId);
    if (targetCol) {
      newCols.push(targetCol);
    }
  });

  onMessage(messages.updateConfiguration, { legendSelectedColumns: newCols });
};

export const handleLegendColumnResize = (
  column: string,
  width: string | number,
  legendSelectedColumns: Array<LegendColumnType>,
  onMessage: (message: string, payload: any) => void
) => {
  const newLegendColumns = legendSelectedColumns.map((col) => {
    if (col.name === column) {
      return {
        ...col,
        width
      };
    }
    return col;
  });

  onMessage(messages.updateConfiguration, { legendSelectedColumns: newLegendColumns });
};

export const generateTableColumns = (activeColumns: Array<string>, legendSelectedColumns: Array<LegendColumnType>) => {
  // using legacy legend column storage. Definitely a better way to do this.
  const selectedTableLegendCols = new Set(activeColumns);
  const currentColumns = TABLE_COLUMNS.filter((col) => selectedTableLegendCols.has(col.id));
  const newColumns = [];
  legendSelectedColumns.forEach((legCol) => {
    const colInfo = currentColumns.find((currCol) => currCol.id === legCol.name);
    if (colInfo) {
      newColumns.push({
        ...colInfo,
        ...(legCol.width ? { width: legCol.width } : {})
      });
    }
  });

  return newColumns;
};

export const legendLabelFormatter = (
  labelSetting: string,
  indicator: IndicatorType,
  appendUnits?: boolean,
  chartType?: string
) => {
  let name = '';
  switch (labelSetting) {
    case 'device':
      name += indicator.deviceDisplayName;
      break;
    case 'object':
      name += `${indicator.objectDisplayName}`;
      if (indicator.objectDescription && chartType !== 'pie') {
        name += ` - ${indicator.objectDescription}`;
      }
      break;
    case 'indicator':
      name += indicator.indicatorTypeDescription;
      break;
    case 'device.object':
      name += `${indicator.deviceDisplayName} - ${indicator.objectDisplayName}`;
      if (indicator.objectDescription && chartType !== 'pie') {
        name += ` - ${indicator.objectDescription}`;
      }
      break;
    case 'device.indicator':
      name += `${indicator.deviceDisplayName} - ${indicator.indicatorTypeDescription}`;
      break;
    case 'object.indicator':
      name += `${indicator.objectDisplayName}`;
      if (indicator.objectDescription && chartType !== 'pie') {
        name += ` - ${indicator.objectDescription}`;
      }
      name += ` - ${indicator.indicatorTypeDescription}`;
      break;
    case 'device.object.indicator':
    default:
      name += `${indicator.deviceDisplayName} - ${indicator.objectDisplayName}`;
      if (indicator.objectDescription && chartType !== 'pie') {
        name += ` - ${indicator.objectDescription}`;
      }
      name += ` - ${indicator.indicatorTypeDescription}`;
  }

  // Displaying the indicator unit only for the PM histogram.
  if (appendUnits) {
    const unit = get(indicator, 'indicatorData.unit', '');
    name = `${name}${unit ? ` (${unit})` : ''}`;
  }

  return name;
};

export function buildSubtitle(
  configuration: ConfigurationType,
  currentSubtitle: string
): string {
  const { timeSpan, timeZone } = configuration;

  let subtitle = currentSubtitle;
  if (subtitle === '') {
    subtitle = calculateTimeRange(timeSpan, timeZone);
  }

  return subtitle;
}

export function buildTitle(currentTitle: string): string {
  let title = currentTitle;
  if (title === '') {
    title = 'Performance Metrics';
  }

  return title;
}

export type TableRowType = {
  id: string,
  deviceId: number,
  deviceName: string,
  deviceDisplayName: string,
  objectId: number,
  objectName: string,
  objectDisplayName: string
  objectDescription: string,
  indicatorId: number,
  indicatorTypeId: number,
  indicatorName: string,
  indicatorTypeName: string,
  objectTypePath: string
  pluginName: string,
  pluginObjectName: string,
  aggregationType: string,
  average: number,
  frequency: number,
  last: number | null,
  maximum: number,
  minimum: number,
  units: string,
  total: number,
  percentile: number,
  indicatorData: IndicatorDataType,
  percentData: {
    indicatorData: IndicatorDataType,
    average: number,
    last: number | null,
    maximum: number,
    minimum: number,
    units: string,
    total: number
  },
  metadata: Array<MetadataType>
}

export const buildSeriesId = (
  indicator: IndicatorType,
  metadata: string
) => {
  const format = 'device.object.indicator';
  const id = `${legendLabelFormatter(format, indicator, false)}-${metadata}`;
  // remove spaces
  return id.replace(/\s+/g, '');
};

export function transformTableData(
  indicators: Array<IndicatorType>,
  percentage: boolean
): Array<TableRowType> {
  return indicators.map((indicator) => {
    const last = get(findLast(indicator.indicatorData.data, (d) => d.value !== null), 'value', null);
    const lastPercent = get(findLast(indicator.percentData.indicatorData.data, (d) => d.value !== null), 'value', null);
    const row = {
      id: buildSeriesId(indicator, 'indicator'),
      deviceId: indicator.deviceId,
      deviceName: indicator.deviceName,
      deviceDisplayName: indicator.deviceDisplayName,
      objectId: indicator.objectId,
      objectName: indicator.objectName,
      objectDisplayName: indicator.objectDisplayName,
      objectDescription: indicator.objectDescription,
      indicatorId: indicator.indicatorId,
      indicatorTypeId: indicator.indicatorTypeId,
      indicatorName: indicator.indicatorTypeDescription,
      indicatorTypeName: indicator.indicatorName,
      objectTypePath: indicator.objectTypePath,
      pluginName: indicator.pluginName,
      pluginObjectName: indicator.pluginObjectName,
      aggregationType: 'DATA',
      average: indicator.indicatorData.avgY,
      frequency: indicator.frequency,
      last,
      maximum: indicator.indicatorData.maxY,
      minimum: indicator.indicatorData.minY,
      units: percentage ? indicator.percentData.indicatorData.unit : indicator.indicatorData.unit,
      total: indicator.indicatorData.total,
      percentile: percentage ? indicator.percentData.indicatorData.percentiles : indicator.indicatorData.percentiles,
      indicatorData: indicator.indicatorData,
      percentData: {
        ...indicator.percentData,
        last: lastPercent,
        maximum: indicator.percentData.indicatorData.maxY,
        minimum: indicator.percentData.indicatorData.minY,
        total: indicator.percentData.indicatorData.total,
        average: indicator.percentData.indicatorData.avgY,
        units: indicator.percentData.indicatorData.unit
      },
      metadata: indicator.metadata
    };
    indicator.metadata.forEach(({ attributeId, entityType, values }) => {
      row[`metadataAttribute:${attributeId}:${entityType}`] = values.join(', ');
    });

    return row;
  });
}

export const renderStandardDeviation = (chartType: string, sigmaSeries) => {
  return (params, api) => {
    // Bar graphs are centered around 0 anyway
    const minValue = (api.value(1) > 0 && chartType === 'line') ? api.value(1) : 0;
    const start = api.coord([ api.value(0), api.value(2) ]);
    const timeDiff = sigmaSeries[1] && sigmaSeries[0] ? sigmaSeries[1].value[0] - sigmaSeries[0].value[0] : 0;
    const size = api.size([ timeDiff, api.value(2) - minValue ]);
    const customStyle = api.style({
      stroke: null,
      fill: api.visual('color')
    });
    return {
      type: 'rect',
      shape: {
        x: start[0] - (size[0] * 0.5),
        y: start[1],
        width: size[0],
        height: size[1]
      },
      style: customStyle
    };
  };
};

export const buildThresholds = (thresholds: ThresholdsType) => {
  if (thresholds.show) {
    return thresholds.lines.map((thres, i) => {
      return {
        id: `${thres.name}-${i}`,
        name: thres.name,
        color: thres.color,
        value: thres.value,
        axis: 'yAxis' as 'yAxis'
      };
    });
  }
  return [];
};

export const getDualUnits = (indicators: Array<IndicatorType>, visibleSeries: Array<string>, percentage: boolean) => {
  const visibleSeriesSet = new Set(visibleSeries);
  const unitLocation = percentage ? 'percentData.indicatorData.unit' : 'indicatorData.unit';
  const maxLocation = percentage ? 'percentData.indicatorData.maxY' : 'indicatorData.maxY';
  let leftUnit = get(maxBy(indicators, (ind) => get(ind, maxLocation)), unitLocation);
  if (visibleSeriesSet.size > 0) {
    const visibleIndicators = indicators.filter((ind) => visibleSeriesSet.has(buildSeriesId(ind, 'indicator')));
    leftUnit = get(maxBy(visibleIndicators, (ind) => get(ind, maxLocation)), unitLocation);
  }

  let index = 0;
  let indicatorUnit = get(indicators[index], unitLocation);
  while (indicatorUnit === leftUnit && index < indicators.length) {
    indicatorUnit = get(indicators[index], unitLocation);
    index += 1;
  }
  const rightUnit = indicatorUnit;

  return {
    leftUnit,
    rightUnit
  };
};

export const Y_AXIS_NUM_TICS = 5;

export const handleYAxisFormatter = (value: number, unit?: string) => {
  if (unit) {
    return abbreviateValue(Number(value), { unit: unit.includes('Number') ? undefined : unit });
  }

  return abbreviateValue(Number(value));
};

export const TABLE_COL_MAP = {
  deviceName: 'deviceDisplayName',
  objectName: 'objectDisplayName',
  indicatorTypeDescription: 'indicatorName'
};

export const getColumnProperty = (key: string) => {
  const prop = TABLE_COL_MAP[key];
  return prop || key;
};

export const allowGlobalReportLink = (columnName: string) => {
  const whiteList = [ 'deviceName', 'objectName', 'indicatorName', 'indicatorTypeDescription' ];
  return whiteList.includes(columnName);
};

export const isValueColumn = (columnName: string) => {
  const list = [
    'frequency',
    'last',
    'average',
    'minimum',
    'maximum',
    'total',
    'percentile',
    'units',
    'percentData.last',
    'percentData.average',
    'percentData.minimum',
    'percentData.maximum',
    'percentData.total'
  ];
  return list.includes(columnName);
};

export const zoomBarFormatter = (value, timeZone: string) => {
  const hoursMinutes = getTimeStringFromTimestamp(value, timeZone, 'HH:mm');
  const monthsDays = getTimeStringFromTimestamp(value, timeZone, 'MM-DD');
  return `${hoursMinutes}\n${monthsDays}`;
};

export const getErrorCode = (error: GraphQLErrorType) => {
  return get(error, 'originalError.code', error.code);
};

export const shouldDisableDownsampling = (vizType: string, area: boolean, stack: boolean) => {
  const validVizs = [ 'Table', 'Line' ];

  return !validVizs.includes(vizType) || (vizType === 'Line' && area && stack);
};
