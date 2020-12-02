import {
  generateTimespanFacet,
  generateResourcesFacet,
  generateDatasourceFacet
} from '@sevone/insight-connect';
import { facetManager, FacetType } from '@sevone/insight-wdk';
import { timespanToFacet, unitsSchema } from '@sevone/insight-widget-components';
import { IndicatorType } from '../../fetch-data';
import {
  TimeSpanType,
  SpecificTimeSpanType,
  PrefferedUnitsType
} from '../../default-configuration';

type IndicatorFacetIndicatorInfoType = {
  deviceName: string,
  objectName: string,
  indicatorName: string,
  objectTypePath: string,
  pluginObjectName: string
}

export const buildIndicatorFacet = (
  indicators: Array<IndicatorFacetIndicatorInfoType>
): FacetType => {
  const dataPayload = {
    type: 'INDICATOR',
    resources: indicators.map((ind) => {
      return {
        deviceName: ind.deviceName,
        objectName: ind.objectName,
        indicatorType: {
          value: ind.indicatorName,
          objectType: {
            value: ind.objectTypePath.split('/').filter((path: string) => path !== ''),
            plugin: {
              value: ind.pluginObjectName
            }
          }
        }
      };
    })
  } as const;
  return generateResourcesFacet(dataPayload);
};

type ObjectFacetIndicatorInfoType = {
  objectName: string,
  deviceName: string,
  pluginObjectName: string
}

export const buildObjectFacets = (
  indicators: Array<ObjectFacetIndicatorInfoType>
): FacetType => {
  const dataPayload = {
    type: 'OBJECT',
    resources: indicators.map((ind) => {
      return {
        value: ind.objectName,
        device: { value: ind.deviceName },
        plugin: { value: ind.pluginObjectName }
      };
    })
  } as const;
  return generateResourcesFacet(dataPayload);
};

export const buildTimeSpanFacet = (
  timespan: TimeSpanType,
  timezone: string,
  zoomTime: SpecificTimeSpanType | null
): FacetType => {
  if (zoomTime) {
    return generateTimespanFacet({
      startTime: zoomTime.specificInterval.start,
      endTime: zoomTime.specificInterval.end,
      timezone
    });
  }

  return timespanToFacet(timespan, timezone);
};

type DeviceFacetIndicatorInfoType = {
  deviceName: string
}

const buildDeviceFacets = (
  indicators: Array<DeviceFacetIndicatorInfoType>
): FacetType => {
  const dataPayload = {
    type: 'DEVICE',
    resources: indicators.map((ind) => {
      return { value: ind.deviceName };
    })
  } as const;
  return generateResourcesFacet(dataPayload);
};

export const generateUnitsFacets = (
  units: PrefferedUnitsType,
  percentage: boolean
) => {
  return facetManager.createFacet(unitsSchema, {
    units,
    usePercentage: percentage
  });
};

type IndicatorFacetInfoType = ObjectFacetIndicatorInfoType & IndicatorFacetIndicatorInfoType;

export const generateChartFacets = (
  indicators: Array<IndicatorFacetInfoType>,
  timeSpan: TimeSpanType,
  timeZone: string,
  datasourceId: number,
  units: PrefferedUnitsType,
  percentage: boolean,
  zoomTime?: SpecificTimeSpanType
) => {
  const resourcFacets = [];
  // order matters here. We want to broadcast from least specific to most specific.
  // so we broadcast devices, objects, then indicators.
  resourcFacets.push(buildDeviceFacets(indicators));
  resourcFacets.push(buildObjectFacets(indicators));
  resourcFacets.push(buildIndicatorFacet(indicators));
  return [
    ...resourcFacets,
    buildTimeSpanFacet(timeSpan, timeZone, zoomTime),
    generateDatasourceFacet({ datasource: datasourceId }),
    generateUnitsFacets(units, percentage)
  ];
};

type ChartReportLinkFacetIndicatorInfoType = IndicatorFacetInfoType & DeviceFacetIndicatorInfoType;

export const generateChartReportLinkFacets = (
  indicator: ChartReportLinkFacetIndicatorInfoType,
  timeSpan: TimeSpanType,
  timeZone: string,
  datasourceId: number,
  zoomTime?: SpecificTimeSpanType
) => {
  const deviceFacet = buildDeviceFacets([ indicator ]);
  const objectFacet = buildObjectFacets([ indicator ]);
  const indicatorFacet = buildIndicatorFacet([ indicator ]);
  return [
    deviceFacet,
    objectFacet,
    indicatorFacet,
    buildTimeSpanFacet(timeSpan, timeZone, zoomTime),
    generateDatasourceFacet({ datasource: datasourceId })
  ];
};

export const buildAllPossiblePayloads = (
  indicators: Array<IndicatorType>
) => {
  const devicesRes = [];
  const objectsRes = [];
  const indicatorsRes = [];

  indicators.forEach((ind) => {
    devicesRes.push({
      value: ind.deviceName
    });
    objectsRes.push({
      value: ind.objectName,
      device: { value: ind.deviceName },
      plugin: {
        value: ind.pluginObjectName
      }
    });
    indicatorsRes.push({
      deviceName: ind.deviceName,
      objectName: ind.objectName,
      indicatorType: {
        value: ind.indicatorName,
        objectType: {
          value: ind.objectTypePath.split('/').filter((path: string) => path !== ''),
          plugin: {
            value: ind.pluginObjectName
          }
        }
      }
    });
  });

  return {
    DEVICE: devicesRes,
    OBJECT: objectsRes,
    INDICATOR: indicatorsRes
  };
};

export const buildReportLinkPayload = (
  columnId: string,
  row: { [key: string]: any }
) => {
  let facet: { type: 'DEVICE' | 'OBJECT' | 'INDICATOR', resources: Array<any> };
  switch (columnId) {
    case 'deviceName':
    case 'deviceId':
      facet = {
        type: 'DEVICE',
        resources: [ {
          value: row.deviceName
        } ]
      };
      break;
    case 'objectName':
    case 'objectId':
    case 'objectDescription':
      facet = {
        type: 'OBJECT',
        resources: [ {
          value: row.objectName,
          device: { value: row.deviceName },
          plugin: {
            value: row.pluginObjectName
          }
        } ]
      };
      break;
    case 'indicator':
    case 'indicatorId':
    case 'indicatorName':
    case 'indicatorTypeDescription':
    case 'value':
      facet = {
        type: 'INDICATOR',
        resources: [
          {
            deviceName: row.deviceName,
            objectName: row.objectName,
            indicatorType: {
              value: row.indicatorTypeName,
              objectType: {
                value: row.objectTypePath.split('/').filter((path: string) => path !== ''),
                plugin: {
                  value: row.pluginObjectName
                }
              }
            }
          }
        ]
      };
      break;
    default:
      return null;
  }
  return facet;
};
