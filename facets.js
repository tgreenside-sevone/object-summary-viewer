const {
  datasourceSchema,
  timespanSchema,
  resourcesSchema,
  mixedResourcesSchema,
  metadataSchema
} = require('@sevone/insight-connect');

const consumedFacets = {
  datasource: datasourceSchema,
  timespan: timespanSchema,
  resources: resourcesSchema({
    allowedResources: [ 'DEVICE_GROUP', 'DEVICE', 'OBJECT_GROUP', 'OBJECT' ]
  }),
  mixedResources: mixedResourcesSchema({
    allowedResources: [ 'DEVICE_GROUP', 'DEVICE', 'OBJECT_GROUP', 'OBJECT' ]
  }),
  objectMetadata: metadataSchema({ allowedEntityTypes: [ 'OBJECT' ] })
};

const producedFacets = {
  datasource: datasourceSchema,
  timespan: timespanSchema,
  resources: resourcesSchema({
    allowedResources: [ 'DEVICE_GROUP', 'DEVICE', 'OBJECT_GROUP' ]
  })
};

module.exports = { consumedFacets, producedFacets };
