import defaultConfiguration from './default-configuration';
import { configToVariables } from './config-to-variables';
import fetchData from './fetch-data';
import settings from './settings';
import visualizations from './visualizations';
import { mapInputToConfig } from './map-input-to-config';
import { exportData } from './export-data';

const widget = {
  defaultConfiguration,
  configToVariables,
  mapInputToConfig,
  fetchData,
  exportData,
  settings,
  visualizations
};

export default widget;
