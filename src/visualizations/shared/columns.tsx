import * as React from 'react';
import styled from 'styled-components';
import { abbreviateValue } from '@sevone/insight-widget-components';
import isNumber from 'lodash-es/isNumber';

export const Cell = styled.div`
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

export const TABLE_COLUMNS = [
  {
    id: 'name',
    title: 'Name',
    sort: (row, otherRow) => {
      const { name } = row;
      const { name: otherName } = otherRow;
      if (name < otherName) {
        return -1;
      }
      if (name > otherName) {
        return 1;
      }
      return 0;
    },
    render: (data) => (<Cell>{data.name}</Cell>)
  },
  {
    id: 'frequency',
    title: 'Freq',
    sort: (row, otherRow) => {
      const { frequency } = row;
      const { frequency: otherFrequency } = otherRow;
      if (frequency < otherFrequency) {
        return -1;
      }
      if (frequency > otherFrequency) {
        return 1;
      }
      return 0;
    },
    render: (data) => <Cell>{(isNumber(data.frequency) ? `${data.frequency}s` : data.frequency)}</Cell>
  },
  {
    id: 'last',
    title: 'Last',
    sort: (row, otherRow) => {
      const { last } = row;
      const { last: otherLast } = otherRow;
      if (last < otherLast) {
        return -1;
      }
      if (last > otherLast) {
        return 1;
      }
      return 0;
    },
    render: (data) => {
      return <Cell>{isNumber(data.last) ? abbreviateValue(data.last) : data.last}</Cell>;
    }
  },
  {
    id: 'average',
    title: 'Avg',
    sort: (row, otherRow) => {
      const { average } = row;
      const { average: otherAverage } = otherRow;
      if (average < otherAverage) {
        return -1;
      }
      if (average > otherAverage) {
        return 1;
      }
      return 0;
    },
    render: (data) => <Cell>{(isNumber(data.average) ? abbreviateValue(data.average) : data.average)}</Cell>
  },
  {
    id: 'maximum',
    title: 'Max',
    sort: (row, otherRow) => {
      const { maximum } = row;
      const { maximum: otherMaximum } = otherRow;
      if (maximum < otherMaximum) {
        return -1;
      }
      if (maximum > otherMaximum) {
        return 1;
      }
      return 0;
    },
    render: (data) => <Cell>{(isNumber(data.maximum) ? abbreviateValue(data.maximum) : data.maximum)}</Cell>
  },
  {
    id: 'minimum',
    title: 'Min',
    sort: (row, otherRow) => {
      const { minimum } = row;
      const { minimum: otherMinimum } = otherRow;
      if (minimum < otherMinimum) {
        return -1;
      }
      if (minimum > otherMinimum) {
        return 1;
      }
      return 0;
    },
    render: (data) => <Cell>{isNumber(data.minimum) ? abbreviateValue(data.minimum) : data.minimum}</Cell>
  },
  {
    id: 'total',
    title: 'Total',
    sort: (row, otherRow) => {
      const { total } = row;
      const { total: otherTotal } = otherRow;
      if (total < otherTotal) {
        return -1;
      }
      if (total > otherTotal) {
        return 1;
      }
      return 0;
    },
    render: (data) => <Cell>{(isNumber(data.total) ? abbreviateValue(data.total) : data.total)}</Cell>
  },
  {
    id: 'units',
    title: 'Units',
    sort: (row, otherRow) => {
      const { units } = row;
      const { units: otherUnits } = otherRow;
      if (units < otherUnits) {
        return -1;
      }
      if (units > otherUnits) {
        return 1;
      }
      return 0;
    },
    render: (data) => <Cell>{data.units}</Cell>
  },
  {
    id: 'percentile',
    title: 'Percentile',
    sort: (row, otherRow) => {
      const { percentile } = row;
      const { percentile: otherPercentile } = otherRow;
      if (percentile < otherPercentile) {
        return -1;
      }
      if (percentile > otherPercentile) {
        return 1;
      }
      return 0;
    },
    render: (data) => <Cell>{isNumber(data.percentile) ? abbreviateValue(data.percentile) : data.percentile}</Cell>
  }
];
