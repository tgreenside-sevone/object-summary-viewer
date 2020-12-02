import { sentenceCase } from '@sevone/insight-widget-components';
import isNumber from 'lodash-es/isNumber';
import get from 'lodash-es/get';
import isNil from 'lodash-es/isNil';
import isEmpty from 'lodash-es/isEmpty';
import maxBy from 'lodash-es/maxBy';
import { legendLabelFormatter, buildSeriesId } from './index';
import {
  IndicatorType,
  PMType,
  DataPointType,
  MaintenanceWindowsType
} from '../../fetch-data';
import {
  ConfigurationType,
  BaselineType,
  LineSettingsType,
} from '../../default-configuration';

export type SeriesMetadataType = {
  id: string,
  type: string,
  deviceName: string,
  objectName: string,
  objectDescription: string,
  pluginName: string,
  indicatorName: string,
  indicatorTypeDescription: string,
  frequency: number,
  unit: string,
  avgY: number,
  maxY: number,
  minY: number,
  deviceDisplayName: string,
  objectDisplayName: string,
  last?: number,
  yAxisIndex?: number
}

const formatCellValue = (value: any) => {
  return isNil(value) ? 'n/a' : value;
};

const formatData = (data, invert = false) => {
  let { value } = data;

  if (invert && isNumber(data.value)) {
    value = -value;
  }

  if (data === null) {
    return [
      data.time,
      null
    ];
  }

  return [
    data.time,
    value
  ];
};

const formatHistogramData = (data, field) => ({
  name: data.minValue,
  minValue: data.minValue,
  maxValue: data.maxValue,
  tally: data[field]
});

export const buildGoalLineRow = (
  goalLineSettings: ThresholdsType
) => {
  const rows = [];
  if (goalLineSettings.show) {
    goalLineSettings.lines.forEach((goalLine, i) => {
      rows.push({
        id: `${goalLine.name}-${i}`,
        name: goalLine.name,
        frequency: 'n/a',
        minimum: 'n/a',
        maximum: 'n/a',
        average: 'n/a',
        last: 'n/a',
        total: 'n/a',
        units: 'n/a',
        percentile: 'n/a'
      });
    });
  }
  return rows;
};

const getLastValue = (
  summaryData: SummaryDataType
) => {
  let index = summaryData.data.length - 1;
  let currentLastValue;
  if (!isEmpty(summaryData.data)) {
    currentLastValue = summaryData.data[summaryData.data.length - 1].value;
    while (currentLastValue === null && index > 0) {
      index -= 1;
      currentLastValue = summaryData.data[index].value;
    }
  }

  return currentLastValue;
};

type SummaryDataType = {
  data: Array<DataPointType>,
  maxY: number,
  minY: number,
  avgY: number,
  total: number,
  unit: string
};

export const buildRow = (
  indicator: IndicatorType,
  summaryData: SummaryDataType,
  displayName: string,
  id: string,
  percentage: boolean
) => {
  return {
    id,
    name: displayName,
    frequency: indicator.frequency,
    minimum: formatCellValue(summaryData.minY),
    maximum: formatCellValue(summaryData.maxY),
    average: formatCellValue(summaryData.avgY),
    last: formatCellValue(getLastValue(summaryData)),
    total: formatCellValue(summaryData.total),
    units: summaryData.unit,
    percentile: formatCellValue(
      percentage ? indicator.percentData.indicatorData.percentiles : indicator.indicatorData.percentiles
    )
  };
};

const includePreandPostData = (chartType: string) => {
  const charts = [ 'line', 'bar' ];

  return charts.includes(chartType);
};

export const getIndicatorData = (
  indicator: IndicatorType,
  displayName: string,
  invert: boolean = false,
  shouldRender: boolean,
  chartType: string,
  leftUnit: string,
  dualY: boolean,
  percentage: boolean
) => {
  if (shouldRender) {
    const {
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      deviceDisplayName,
      objectDisplayName
    } = indicator;
    const indicatorDataObject = percentage ? indicator.percentData.indicatorData : indicator.indicatorData;
    const { unit, avgY, maxY, minY, data, preData, postData } = indicatorDataObject;
    let displayUnit = unit;
    if (chartType === 'histogram') {
      displayUnit = percentage ? '%' : 'data point(s)';
    }
    const pre = includePreandPostData(chartType) ? formatData(preData, false) : [];
    const post = includePreandPostData(chartType) ? formatData(postData, false) : [];
    const dataField = percentage ? 'percent' : 'tally';
    const buckets = chartType === 'histogram' ?
      indicatorDataObject.histogram.buckets.map((dataItem) => formatHistogramData(dataItem, dataField)) : undefined;
    // Use straight data from work hours if we did that caluculation as it's
    // already formatted, otherwise format data
    const indicatorSeries = data.map((dataItem) => formatData(dataItem, false));
    const indicatordata = [ pre, ...indicatorSeries, post ].filter((point) => point.length);
    const id = buildSeriesId(indicator, 'indicator');

    let yAxisIndex = 0;
    if (dualY) {
      yAxisIndex = unit === leftUnit ? 0 : 1;
    }

    // extract indicator metadata for tooltip
    const indicatorMetaData = {
      id,
      type: 'indicator',
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      unit: displayUnit,
      avgY,
      maxY,
      minY,
      invert,
      deviceDisplayName,
      objectDisplayName,
      yAxisIndex
    };

    const indicatorSeriesData = {
      id,
      name: displayName,
      yAxisIndex,
      data: indicatordata.map((point) => ({ value: point })),
      buckets,
      metadata: indicatorMetaData
    };

    return {
      indicatorSeriesData,
      indicatorMetaData,
      indicatorRow: buildRow(
        indicator,
        percentage ? indicator.percentData.indicatorData : indicator.indicatorData,
        displayName,
        id,
        percentage
      )
    };
  }
  return {};
};

const getMaintenanceWindowsData = (
  maintenanceWindows: Array<MaintenanceWindowsType>,
  maintenanceWindowsSettings: MaintenanceWindowsSettingsType
) => {
  if (maintenanceWindows && maintenanceWindowsSettings.enable) {
    return maintenanceWindows.map((window: MaintenanceWindowsType) => {
      return {
        markArea: {
          id: window.id,
          name: window.name,
          start: window.scheduleInstance.startTime,
          end: window.scheduleInstance.endTime
        },
        row: {
          id: window.id,
          name: window.name,
          frequency: formatCellValue(null),
          minimum: formatCellValue(null),
          maximum: formatCellValue(null),
          average: formatCellValue(null),
          last: formatCellValue(null),
          total: formatCellValue(null),
          units: formatCellValue(null),
          percentile: formatCellValue(null)
        }
      };
    });
  }
  return [];
};

const getWorkHoursData = (
  indicator: IndicatorType,
  workHoursSettings: WorkHoursType
): Array<{ min: number, max: number }> => {
  if (workHoursSettings.type !== 'NONE') {
    const { data } = indicator.indicatorData;
    const pieces: Array<{ min: number, max: number }> = [];
    let start = null;
    let end = null;
    let setMaxOnly = false;

    for (let i = 0; i < data.length; i++) {
      const dataPoint = data[i];
      const nextDataPoint = data[i + 1] || null;
      if (!dataPoint.focus && start === null) {
        start = dataPoint.time;
        // if start is the first data point, don't set min
        if (start === data[0].time) {
          setMaxOnly = true;
        }
      }

      if (!dataPoint.focus && (nextDataPoint === null || nextDataPoint.focus)) {
        end = dataPoint.time;
        const piece = setMaxOnly ? { min: start, max: end } : { min: start, max: end };
        pieces.push(piece);
        start = null;
        end = null;
      }
    }

    return pieces;
  }

  return [];
};

const renderStandardDeviation = (chartType: string, sigmaSeries, invert) => {
  return (params, api) => {
    // Bar graphs are centered around 0 anyway
    const minValue = (chartType === 'line' && !invert) ? Math.max(api.value(1), 0) : api.value(1);
    const maxValue = (chartType === 'line' && !invert) ? api.value(2) : Math.min(api.value(2), 0);
    const start = api.coord([ api.value(0), api.value(2) ]);
    const timeDiff = sigmaSeries[1] && sigmaSeries[0] ? sigmaSeries[1].value[0] - sigmaSeries[0].value[0] : 0;
    const size = api.size([ timeDiff, maxValue - minValue ]);
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

const getSigmaData = (
  indicator: IndicatorType,
  baselineSettings: BaselineType,
  invert: boolean = false,
  displayName: string,
  chartType: string,
  leftUnit: string,
  dualY: boolean,
  percentage: boolean
) => {
  const standardDeviationDataObject = percentage ?
    indicator.percentData.standardDeviationData : indicator.standardDeviationData;
  if (baselineSettings.enable && standardDeviationDataObject && standardDeviationDataObject.data) {
    const {
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      deviceDisplayName,
      objectDisplayName
    } = indicator;
    const formatDataDeviation = (data) => {
      if (data === null) {
        return {
          name: null,
          value: [
            data.time,
            null
          ]
        };
      }
      const { min, max } = data;
      const y = invert ? [ -max, -min ] : [ min, max ];
      return {
        name: max,
        value: [
          data.time,
          ...y
        ]
      };
    };
    const { preData, postData, unit, avgY, maxY, minY, data } = standardDeviationDataObject;
    const pre = includePreandPostData(chartType) ? formatDataDeviation(preData) : [];
    const post = includePreandPostData(chartType) ? formatDataDeviation(postData) : [];
    const sigmaSeries = data.map((dataItem) => formatDataDeviation(dataItem));
    const sigmaData = [ pre, ...sigmaSeries, post ];
    const sigmaNameMetadata = `(${baselineSettings.standardDeviation} Standard Deviation(s))`;
    const sigmaName = `${displayName} ${sigmaNameMetadata}`;

    let yAxisIndex = 0;
    if (dualY) {
      yAxisIndex = unit === leftUnit ? 0 : 1;
    }

    const renderItemLine = renderStandardDeviation('line', sigmaSeries, invert);
    const id = buildSeriesId(indicator, sigmaNameMetadata);
    const sigmaSeriesData = {
      id,
      type: 'custom',
      yAxisIndex,
      name: sigmaName,
      data: sigmaData,
      step: 'middle',
      renderItem: renderItemLine,
      encode: {
        x: 0,
        y: [ 2, 1 ]
      },
      itemStyle: {
        opacity: 0.2
      }
    };

    // extract indicator metadata for tooltip
    const sigmaMetaData = {
      id,
      type: 'sigma',
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      unit,
      avgY,
      maxY,
      minY,
      standardDeviation: baselineSettings.standardDeviation,
      deviceDisplayName,
      objectDisplayName,
      yAxisIndex
    };

    return {
      sigmaSeriesData,
      sigmaMetaData,
      sigmaRow: buildRow(
        indicator,
        percentage ? indicator.percentData.sigmaData : indicator.sigmaData,
        sigmaName,
        id,
        percentage
      )
    };
  }

  return {};
};

const getPercentileData = (
  indicator: IndicatorType,
  percentileSettings: PercentilesType,
  displayName: string,
  leftUnit: string,
  dualY: boolean,
  percentage: boolean
) => {
  const percentileDataObject = percentage ? indicator.percentData.indicatorData : indicator.indicatorData;
  if (percentileSettings && percentileDataObject && percentileDataObject.percentiles) {
    const percentileData = percentileDataObject.percentiles;
    const {
      unit,
      avgY,
      maxY,
      minY
    } = percentileDataObject;
    const {
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      deviceDisplayName,
      objectDisplayName
    } = indicator;
    const nameMetadata = '(percentile)';
    const id = buildSeriesId(indicator, nameMetadata);

    let yAxisIndex = 0;
    if (dualY) {
      yAxisIndex = unit === leftUnit ? 0 : 1;
    }

    const percentileSeriesData = {
      id,
      type: 'line',
      yAxisIndex,
      disableWithParent: true,
      name: `${displayName} ${nameMetadata}`,
      data: indicator.indicatorData.data.map((point) => {
        return {
          value: [ point.time, percentileData ]
        };
      }),
      lineStyle: {
        type: 'dashed',
        width: 1
      }
    };
    const percentileMetaData = {
      id,
      type: 'percentile',
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      unit,
      avgY,
      maxY,
      minY,
      deviceDisplayName,
      objectDisplayName,
      percentile: {
        value: percentileData,
        percent: percentileSettings.value
      },
      yAxisIndex
    };

    return {
      percentileSeriesData,
      percentileMetaData
    };
  }

  return {};
};

const getBaselineData = (
  indicator: IndicatorType,
  baselineSettings: BaselineType,
  invert: boolean = false,
  displayName: string,
  chartType: string,
  leftUnit: string,
  dualY: boolean,
  percentage: boolean
) => {
  const baselineDataObject = percentage ? indicator.percentData.baselineData : indicator.baselineData;
  if (baselineSettings.enable && baselineDataObject && baselineDataObject.data) {
    const {
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      deviceDisplayName,
      objectDisplayName
    } = indicator;
    const { preData, postData, unit, avgY, maxY, minY, data } = baselineDataObject;
    let displayUnit = unit;
    if (chartType === 'histogram') {
      displayUnit = percentage ? '%' : 'data point(s)';
    }
    const pre = includePreandPostData(chartType) ? formatData(preData, invert) : [];
    const post = includePreandPostData(chartType) ? formatData(postData, invert) : [];
    const dataField = percentage ? 'percent' : 'tally';
    const buckets = chartType === 'histogram' ?
      baselineDataObject.histogram.buckets.map((dataItem) => formatHistogramData(dataItem, dataField)) : undefined;
    const baselineSeries = data.map((dataItem) => formatData(dataItem, invert));
    const baselineData = [ pre, ...baselineSeries, post ];
    const nameMetadata = '(Baseline)';
    const baselineName = `${displayName} ${nameMetadata}`;
    const id = buildSeriesId(indicator, nameMetadata);

    let yAxisIndex = 0;
    if (dualY) {
      yAxisIndex = unit === leftUnit ? 0 : 1;
    }

    let chartStyle = {};
    if (chartType === 'histogram') {
      chartStyle = {
        itemStyle: {
          opacity: 0.5
        }
      };
    } else {
      chartStyle = {
        lineStyle: {
          type: 'dashed',
          width: 1
        }
      };
    }

    const baselineSeriesData = {
      id,
      type: chartType === 'histogram' ? 'bar' : 'line',
      yAxisIndex,
      name: baselineName,
      data: baselineData.map((dataPoint) => ({ value: dataPoint })),
      buckets,
      step: 'middle',
      ...chartStyle
    };

    const baselineMetaData = {
      id,
      type: 'baseline',
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      unit: displayUnit,
      avgY,
      maxY,
      minY,
      deviceDisplayName,
      objectDisplayName,
      yAxisIndex
    };

    return {
      baselineSeriesData,
      baselineMetaData,
      baselineRow: buildRow(indicator, baselineDataObject, baselineName, id, percentage)
    };
  }

  return {};
};

const getTimeOverTimeData = (
  indicator: IndicatorType,
  timeOverTimeSettings: TimeOverTimeType,
  invert: boolean = false,
  displayName: string,
  chartType: string,
  leftUnit: string,
  dualY: boolean,
  percentage: boolean
) => {
  const timeOverTimeObject = percentage ? indicator.percentData.timeOverTimeData : indicator.timeOverTimeData;
  if (timeOverTimeSettings.enable && timeOverTimeObject && timeOverTimeObject.data) {
    const {
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      deviceDisplayName,
      objectDisplayName
    } = indicator;
    const { preData, postData, unit, avgY, maxY, minY, data } = timeOverTimeObject;
    const dataField = percentage ? 'percent' : 'tally';
    const pre = includePreandPostData(chartType) ? formatData(preData, invert) : [];
    const post = includePreandPostData(chartType) ? formatData(postData, invert) : [];
    const buckets = chartType === 'histogram' ?
      timeOverTimeObject.histogram.buckets.map((dataItem) => formatHistogramData(dataItem, dataField)) : undefined;
    const timeOverTimeSeries = data.map((dataItem) => formatData(dataItem, invert));
    const timeOverTimeData = [ pre, ...timeOverTimeSeries, post ];
    const totSettingName = sentenceCase(`${timeOverTimeSettings.type}
      of the previous ${timeOverTimeSettings.period} ${sentenceCase(timeOverTimeSettings.units)}`);
    const nameMetadata = `(${totSettingName})`;
    const timeOverTimeName = `${displayName} ${nameMetadata}`;
    const id = buildSeriesId(indicator, nameMetadata);

    let yAxisIndex = 0;
    if (dualY) {
      yAxisIndex = unit === leftUnit ? 0 : 1;
    }

    let chartStyle = {};
    if (chartType === 'histogram') {
      chartStyle = {
        itemStyle: {
          opacity: 0.2
        }
      };
    } else {
      chartStyle = {
        lineStyle: {
          type: 'dotted',
          width: 2
        }
      };
    }

    // converts to echarts format
    const timeOverTimeSeriesData = {
      id,
      type: chartType,
      yAxisIndex,
      name: timeOverTimeName,
      data: timeOverTimeData.map((dataPoint) => ({ value: dataPoint })),
      buckets,
      ...chartStyle
    };

    // extract indicator metadata for tooltip
    const timeOverTimeMetaData = {
      id,
      type: 'timeOverTime',
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      unit,
      avgY,
      maxY,
      minY,
      totSettingName,
      deviceDisplayName,
      objectDisplayName,
      yAxisIndex
    };

    return {
      timeOverTimeSeriesData,
      timeOverTimeMetaData,
      timeOverTimeRow: buildRow(indicator, timeOverTimeObject, timeOverTimeName, id, percentage)
    };
  }
  return {};
};

const getTrendData = (
  indicator: IndicatorType,
  trendSettings: TrendType,
  invert: boolean = false,
  displayName: string,
  leftUnit: string,
  dualY: boolean,
  percentage: boolean
) => {
  const trendDataObject = percentage ? indicator.percentData.trendData : indicator.trendData;
  if (trendSettings.enable && trendDataObject && trendDataObject.data) {
    const {
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      deviceDisplayName,
      objectDisplayName
    } = indicator;
    const { preData, postData, unit, avgY, maxY, minY, data } = trendDataObject;
    const pre = formatData(preData, invert);
    const post = formatData(postData, invert);
    const trendSeries = data.map((dataItem) => formatData(dataItem, invert));
    const trendData = [ pre, ...trendSeries, post ];
    // const trendSettingName = sentenceCase(`${'Trend'}
    //   of the previous ${timeOverTime.period} ${timeOverTime.units.value}`);
    const nameMetadata = '(Trend)';
    const trendName = `${displayName} ${nameMetadata}`;
    const id = buildSeriesId(indicator, nameMetadata);

    let yAxisIndex = 0;
    if (dualY) {
      yAxisIndex = unit === leftUnit ? 0 : 1;
    }

    // converts to echarts format
    const trendSeriesData = {
      id,
      type: 'line',
      yAxisIndex,
      name: trendName,
      data: trendData.map((dataPoint) => ({ value: dataPoint, name: dataPoint[1] })),
      lineStyle: {
        type: 'solid',
        width: 3,
        opacity: 0.3
      }
    };

    // extract indicator metadata for tooltip
    const trendMetaData = {
      id,
      type: 'trend',
      deviceName,
      objectName,
      objectDescription,
      pluginName,
      indicatorName,
      indicatorTypeDescription,
      frequency,
      unit,
      avgY,
      maxY,
      minY,
      trendSettingName: trendName,
      deviceDisplayName,
      objectDisplayName,
      yAxisIndex
    };
    return {
      trendSeriesData,
      trendMetaData,
      trendRow: buildRow(indicator, trendDataObject, trendName, id, percentage)
    };
  }
  return {};
};

export const buildSeriesData = (
  pm: PMType,
  settings: LineSettingsType | BarSettingsType | HistogramSettingsType,
  configuration: ConfigurationType,
  chartType: 'bar' | 'line' | 'histogram'
) => {
  const { indicators, maintenanceWindows } = pm;
  const { baseline, timeOverTime, trend, percentiles, workHours } = configuration;
  const series = [];
  let pieces = [];
  const rows = [];
  const indicatorsMeta = [];
  const maintenanceWindowSeries = getMaintenanceWindowsData(maintenanceWindows, configuration.maintenanceWindows);
  const unitLocation = configuration.percentage ? 'percentData.indicatorData.unit' : 'indicatorData.unit';
  const maxLocation = configuration.percentage ? 'percentData.indicatorData.maxY' : 'indicatorData.maxY';
  const leftUnit = get(maxBy(indicators, (ind) => get(ind, maxLocation)), unitLocation);
  const isDualY = get(settings, 'yAxis.dualY', false);

  indicators.forEach((ind) => {
    const invertIndicatorId = `${ind.deviceName}-${ind.objectName}-${ind.indicatorName}`;
    let invert = false;
    if (chartType === 'line') {
      const castedSettings = settings as LineSettingsType;
      if (castedSettings.yAxis.invertIndicators && castedSettings.yAxis.invertYAxis) {
        const found = castedSettings.yAxis.invertIndicators.find((invertId) => invertId === invertIndicatorId);
        invert = !isNil(found);
      }
    }
    const displayName = legendLabelFormatter(settings.legend.label, ind, chartType === 'histogram');
    const showIndicatorData = !(timeOverTime.enable && timeOverTime.onlyTimeOverTime);
    const subSeries = [];

    // indicatorData
    const {
      indicatorSeriesData,
      indicatorRow,
      indicatorMetaData
    } = getIndicatorData(
      ind,
      displayName,
      invert,
      showIndicatorData,
      chartType,
      leftUnit,
      isDualY,
      configuration.percentage
    );
    rows.push(indicatorRow);
    indicatorsMeta.push(indicatorMetaData);
    // baseline data
    const {
      baselineRow,
      baselineSeriesData,
      baselineMetaData
    } = getBaselineData(ind, baseline, false, displayName, chartType, leftUnit, isDualY, configuration.percentage);
    if (baselineSeriesData) {
      subSeries.push(baselineSeriesData);
    }
    rows.push(baselineRow);
    indicatorsMeta.push(baselineMetaData);
    // timeOverTime
    const {
      timeOverTimeSeriesData,
      timeOverTimeRow,
      timeOverTimeMetaData
    } = getTimeOverTimeData(
      ind,
      timeOverTime,
      false,
      displayName,
      chartType,
      leftUnit,
      isDualY,
      configuration.percentage
    );
    if (timeOverTimeSeriesData) {
      subSeries.push(timeOverTimeSeriesData);
    }
    rows.push(timeOverTimeRow);
    indicatorsMeta.push(timeOverTimeMetaData);

    if (chartType !== 'histogram') {
      // trend
      const {
        trendSeriesData,
        trendRow,
        trendMetaData
      } = getTrendData(ind, trend, false, displayName, leftUnit, isDualY, configuration.percentage);
      if (trendSeriesData) {
        subSeries.push(trendSeriesData);
      }
      rows.push(trendRow);
      indicatorsMeta.push(trendMetaData);
      // percentile
      const {
        percentileSeriesData,
        percentileMetaData
      } = getPercentileData(ind, percentiles, displayName, leftUnit, isDualY, configuration.percentage);
      if (percentileSeriesData) {
        subSeries.push(percentileSeriesData);
      }
      indicatorsMeta.push(percentileMetaData);
      // sigma data
      const {
        sigmaSeriesData,
        sigmaMetaData,
        sigmaRow
      } = getSigmaData(ind, baseline, invert, displayName, chartType, leftUnit, isDualY, configuration.percentage);
      if (sigmaSeriesData) {
        subSeries.push(sigmaSeriesData);
      }
      rows.push(sigmaRow);
      indicatorsMeta.push(sigmaMetaData);
      // work hours
      const newPieces = getWorkHoursData(ind, workHours);
      pieces = pieces.concat(newPieces);
    }

    const newSeries = {
      ...indicatorSeriesData,
      subSeries,
      invert
    };

    series.push(newSeries);
  });

  const goalLineRows = buildGoalLineRow(settings.thresholds);
  goalLineRows.forEach((goalLineRow) => rows.push(goalLineRow));

  const markAreas = [];
  maintenanceWindowSeries.forEach((mw) => {
    rows.push(mw.row);
    markAreas.push(mw.markArea);
  });

  return {
    series,
    rows: rows.filter(Boolean),
    indicatorsMeta: indicatorsMeta.filter(Boolean),
    visualMap: {
      dimension: 0,
      pieces,
      inRange: {
        opacity: 0.3
      }
    },
    markAreas
  };
};
