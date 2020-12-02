import { ConfigurationType } from './default-configuration';
import { DataType } from './fetch-data';

function generateJson(config: ConfigurationType, data: DataType) {
  return [ JSON.stringify(data.alerts, null, 2) ];
}

function exportData(
  config: ConfigurationType,
  data: DataType,
  mimeType: string
) {
  return new Blob(generateJson(config, data), { type: mimeType });
}

export { exportData };
