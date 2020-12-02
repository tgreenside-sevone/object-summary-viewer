import { facetManager } from '@sevone/insight-wdk';
import { parseTimespanFacet } from '@sevone/insight-widget-components';
import { consumedFacets as schemas } from '../facets';
import { ConfigurationType } from './default-configuration';

type FacetType<T = any> = ReturnType<typeof facetManager.createFacet> & {
  data: T
};

function mapInputToConfig(
  prevInput,
  nextInput: { facets?: Array<FacetType>},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: ConfigurationType
): Partial<ConfigurationType> {
  if (!nextInput.facets) {
    return null;
  }

  const { isSchemaCompatible } = facetManager;
  const configPatch: Partial<ConfigurationType> = {};

  nextInput.facets.forEach((facet) => {
    if (!facet.data) {
      return;
    }

    if (isSchemaCompatible(facet.schema, schemas.datasource)) {
      configPatch.datasourceId = facet.data.datasource;
    } else if (isSchemaCompatible(facet.schema, schemas.timespan)) {
      Object.assign(configPatch, parseTimespanFacet(facet));
    } else if (isSchemaCompatible(facet.schema, schemas.objectMetadata)) {
      if (facet.data.entityType === 'OBJECT') {
        configPatch.objectMetadataFilter = facet.data.metadataFilter;
      }
    } else if (isSchemaCompatible(facet.schema, schemas.resources)) {
      configPatch.resources = [ facet.data ];
    } else if (isSchemaCompatible(facet.schema, schemas.mixedResources)) {
      configPatch.resources = facet.data.resources;
    }
  });

  return configPatch;
}

export { mapInputToConfig };
