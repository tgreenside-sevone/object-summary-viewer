import { request } from '@sevone/insight-connect';
import { sentenceCase } from '@sevone/insight-widget-components';
import { WidgetColumnType } from '../../default-configuration';

const query = `
  query metadataAttributes($datasourceId: Int!) {
    metadataAttributes(size: 1000, datasourceId: $datasourceId) {
      id
      name
      entityTypes
      namespace {
        id
        name
      }
    }
  }
`;

export const fetchMetadataColumns = (datasourceId: number) => {
  return request.query(query, { datasourceId }).then((res) => {
    if (res && res.data && res.data.data && res.data.data.metadataAttributes) {
      const { metadataAttributes } = res.data.data;
      const metadataColumns: Array<WidgetColumnType> = [];
      metadataAttributes.forEach((attribute) => {
        attribute.entityTypes.forEach((type) => {
          metadataColumns.push({
            name: `metadataAttribute:${attribute.id}:${type}`,
            label: attribute.name,
            optGroup: `${sentenceCase(type)} [${attribute.namespace.name}]`,
            selected: false
          });
        });
      });
      return metadataColumns;
    }
    return [];
  });
};
