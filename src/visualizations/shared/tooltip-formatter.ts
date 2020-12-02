import includes from 'lodash-es/includes';
import isNil from 'lodash-es/isNil';
import isEmpty from 'lodash-es/isEmpty';
import { abbreviateValue, getTimeStringFromTimestamp } from '@sevone/insight-widget-components';
// import { SeriesMetadataType } from './get-data';

type ExtraSeriesMetadataType = {
  standardDeviation?: string,
  maintenanceWindow?: {
    name: string
  },
  totSettingName?: string,
  percentile?: { percent: number }
}

const buildTooltipLabelForSubseries = (
  //metadata: SeriesMetadataType & ExtraSeriesMetadataType,
  label: string,
  yValue1: string,
  yValue2: string
) => { return null };
/*
  switch (metadata.type) {
    case 'sigma': {
      return `${label} (${metadata.standardDeviation} Standard Deviation(s)) Max: ${yValue2} - Min: ${yValue1}`;
    }
    case 'maintenanceWindow': {
      return `${label} (${metadata.maintenanceWindow.name}`;
    }
    case 'baseline': {
      return `${label} (Baseline)`;
    }
    case 'trend': {
      return `${label} (Trend)`;
    }
    case 'timeOverTime': {
      return `${label} (${metadata.totSettingName})`;
    }
    case 'percentile': {
      return `${label} (${metadata.percentile.percent}th Percentile)`;
    }
    default: {
      return null;
    }
    return null;
  }
};
*/

const buildTooltipLabel = (
  activeProps: Array<string>,
  //metadata: SeriesMetadataType
) => {
  let formattedRow = '';
  if (includes(activeProps, 'deviceName')) {
    formattedRow += `${metadata.deviceDisplayName}`;
  }

  if (includes(activeProps, 'objectName')) {
    if (formattedRow.length > 0) {
      formattedRow += ' - ';
    }
    formattedRow += `${metadata.objectDisplayName}`;
  }

  if (includes(activeProps, 'objectDescription')) {
    if (formattedRow.length > 0) {
      formattedRow += ' - ';
    }
    formattedRow += `${metadata.objectDescription}`;
  }

  if (includes(activeProps, 'indicatorName')) {
    if (formattedRow.length > 0) {
      formattedRow += ' - ';
    }
    formattedRow += `${metadata.indicatorTypeDescription}`;
  }

  if (isEmpty(formattedRow) && includes(activeProps, 'value')) {
    formattedRow = 'Value';
  }

  return formattedRow;
};

const buildMetricRows = (
  activeProps: Array<string>,
  color: string,
  metadata: SeriesMetadataType,
  unit?: string,
  percent?: number
) => {
  const rows = [];
  activeProps.forEach((c) => {
    switch (c) {
      case 'type':
        // TODO - Figure out what is going on with baseline and percentile and update tooltip accordingly
        rows.push({ label: 'Type', value: 'Data', color });
        break;
      case 'frequency':
        rows.push({ label: 'Frequency', value: metadata.frequency, color });
        break;
      case 'average': {
        const avg = abbreviateValue(
          metadata.avgY, { unit }
        );
        rows.push({ label: 'Average', value: avg, color });
        break;
      }
      case 'maximum': {
        const max = abbreviateValue(
          metadata.maxY, { unit }
        );
        rows.push({ label: 'Maximum', value: max, color });
        break;
      }
      case 'minimum': {
        const min = abbreviateValue(
          metadata.minY, { unit }
        );
        rows.push({ label: 'Minimum', value: min, color });
        break;
      }
      case 'percent': {
        if (!isNil(percent)) {
          rows.push({ label: 'Percent', value: `${percent}%`, color });
        }
        break;
      }
      case 'last': {
        const lastValue = abbreviateValue(
          metadata.last || 0, { unit }
        );
        rows.push({ label: 'Last', value: lastValue, color });
        break;
      }
      default:
        break;
    }
  });

  return rows;
};

export const buildTimeRow = (time: number, timeZone: string) => {
  const formattedTime = getTimeStringFromTimestamp(
    time,
    timeZone,
    'dddd, MMMM D YYYY h:mm a'
  );
  const offset = getTimeStringFromTimestamp(time, timeZone, '(UTCZ)');
  const timeStamp = `${formattedTime} ${timeZone.replace('_', ' ')} ${offset}`;

  return { label: timeStamp };
};

const renderTooltip = (rows: Array<{
  label: string,
  value?: number,
  color?: string,
  yAxisIndex?: number
}>) => {
  const styledRows = rows.map((row) => {
    let rowText = `${row.label}`;
    if (!isNil(row.value)) {
      rowText = `${row.label}: ${row.value}`;
    }

    const markerStyle = {
      round: `
      display: inline-block;
      margin-right: 5px;
      border-radius: 10px;
      width: 9px;
      height: 9px;
      background-color: ${row.color};`,
      right: `
      display: inline-block;
      margin-right: 5px;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      border-left: 6px solid ${row.color};
      width: 0px;
      height: 0px;`,
      left: `
      display: inline-block;
      margin-right: 5px;
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      border-right: 6px solid ${row.color};
      width: 0px;
      height: 0px;`
    };

    let style = markerStyle.round;
    if (row.yAxisIndex === 0) {
      style = markerStyle.left;
    } else if (row.yAxisIndex === 1) {
      style = markerStyle.right;
    }

    const colorCircle = row.color ? `<span style="${style}"></span>` : '';

    return `${colorCircle} ${rowText}`;
  });
  return styledRows.join('<br>');
};

type TooltipParamsType = {
  data: {
    value: number | null | Array<number>,
    id?: string
  },
  seriesId?: string
  color: string,
  percent?: number,
  value: number | null | Array<number>
}

export const tooltipFormatter = (
  chartParams: TooltipParamsType | Array<TooltipParamsType>,
  activeProps: Array<string>,
  timeZone: string,
  listOfMetadata: Array<SeriesMetadataType>,
  chartType: string,
  isDualY?: boolean
) => {
  const params = Array.isArray(chartParams) ? chartParams : [ chartParams ];
  const rows = [];

  if (includes(activeProps, 'timestamp') && Array.isArray(params[0]?.value)) {
    rows.push(buildTimeRow(params[0].value[0], timeZone));
  }

  params.forEach((seriesInfo) => {
    let metadata: SeriesMetadataType | undefined;
    if (chartType === 'pie') {
      metadata = listOfMetadata.find((md) => md.id === seriesInfo.data.id);
    } else {
      metadata = listOfMetadata.find((md) => md.id === seriesInfo.seriesId);
    }

    let yValue1;
    let yValue2;

    if (Array.isArray(seriesInfo.data.value)) {
      yValue1 = seriesInfo.data.value[1];
      yValue2 = seriesInfo.data.value[2];
    } else {
      yValue1 = seriesInfo.data.value;
    }

    if (metadata) {
      const { color, percent } = seriesInfo;
      const { unit } = metadata;

      const formattedYValue1 = abbreviateValue(
        yValue1,
        { unit: unit.includes('Number') ? undefined : unit }
      );

      const formatteryValue2 = abbreviateValue(
        yValue2,
        { unit: unit.includes('Number') ? undefined : unit }
      );

      const nameLabel = buildTooltipLabel(
        activeProps,
        metadata as SeriesMetadataType
      );

      const subseriesLabel = buildTooltipLabelForSubseries(
        metadata as SeriesMetadataType,
        nameLabel,
        formattedYValue1,
        formatteryValue2
      );

      const label = subseriesLabel || nameLabel;

      rows.push({
        label,
        color,
        value: (activeProps.includes('value') && metadata.type !== 'sigma') ? formattedYValue1 : undefined,
        yAxisIndex: isDualY ? metadata.yAxisIndex : undefined
      });

      buildMetricRows(
        activeProps,
        color,
        metadata as SeriesMetadataType,
        unit.includes('Number') ? undefined : unit,
        percent
      ).forEach((row) => {
        rows.push(row);
      });
    }
  });

  return renderTooltip(rows);
};
