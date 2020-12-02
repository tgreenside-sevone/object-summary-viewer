import isEmpty from 'lodash-es/isEmpty';

import {
  TimeSpanType,
  ConfigurationType,
  ResourceType
} from './default-configuration';

export type VariablesType = {
  datasourceId: number,
  timeSpan: TimeSpanType,
  timeZone: ConfigurationType['timeZone'],
  resources: {
    [key: string]: any
  }, 
  selectedObject: string
};

function configToVariables(configuration: ConfigurationType): VariablesType {
  const {
    datasourceId,
    resources,
    timeSpan,
    timeZone, 
    selectedObject
  } = configuration;

  // only display plugins that have objects on this device
  const pluginFilter = {
    deviceNames: !isEmpty (resources) ? resources[0].resources.map((res) => res.value) : null
  }

  const pluginObjectFilter = { ...pluginFilter }

  const deviceFilter = { ...pluginFilter }
    
  const transformedResources = [];

  const sortedResources = {
    deviceNames: []
   };

  function transformResource(resource: ResourceType) {
    if (resource.type === 'DEVICE') {
      sortedResources.deviceNames.push(
        // @ts-ignore
        ...resource.resources.map((res) => `<${res.value}>`)
      );
    }
  }

  const typeMap = {
    deviceNames: {
      type: 'DEVICE_NAME',
      deviceNames: {
        names: sortedResources.deviceNames
      }
    }
  } as const;

  if (resources) {
    resources.forEach((resource) => transformResource(resource));
  }

  Object.keys(sortedResources).forEach((type) => {
    if (!isEmpty(sortedResources[type])) {
      transformedResources.push(typeMap[type]);
    }
  });
  // filter objects by id for fetching of PM data
  const PMResources = {
    objectIds: !isEmpty (selectedObject) ? selectedObject.id : null,
    deviceNames:  !isEmpty (resources) ? resources[0].resources.map((res) => res.value) : null
  }

  return {
    datasourceId,
    timeSpan,
    timeZone,
    resources: transformedResources,
    pluginFilter,
    pluginObjectFilter,
    deviceFilter,
    PMResources,
    selectedObject
  };
}

export { configToVariables };
