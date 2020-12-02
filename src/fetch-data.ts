import { request } from '@sevone/insight-connect';
import { memoize } from 'lodash';
import { VariablesType } from './config-to-variables';
import isEmpty from 'lodash-es/isEmpty';

export type GraphQLErrorType = {
  message: string,
  code: string,
  originalError?: { code: string }
}

export type DataType = {
  errors?: Array<GraphQLErrorType>
}

/*
 *  generate a menu of objects for each plugin type for the selected device
 */

const menuVizQuery = `query ( $datasourceId: Int, $pluginFilter: PluginFilterArgs, $pluginObjectFilter: PluginObjectFilterArgs ){
  plugins(
    datasourceId: $datasourceId
    filter: $pluginFilter
    sortBy:NAME
  )
  {
    id
    name
    objectName
    objects (size: 10000, filter: $pluginObjectFilter, sortBy:NAME) {
      id
      name
      description
      isEnabled
      isVisible
      deviceName
      subTypeId
      indicators (size:200, sortBy:DESCRIPTION) {
          id
          indicatorTypeName
          indicatorTypeDescription
          indicatorTypeId
          indicatorType{
            displayUnits
          }
          format
          isEnabled
          maxValue
      }
      objectType {
        id
        name
      }
    }
  }
}`;

/*
  getMenuData uses the lodash "memoize" function to cache menu results
  so that the menu data is not retrieved from the selected device continually with
  each request.  It greatly speeds up rendering time by going to the cache vs. network request.
*/

const getMenuData = memoize(async (vars, transformedVars) => {
  let result: {data: any[], errors?: any[]} = {data: []};

  try {
    const menu_data_response = await request.query(menuVizQuery, vars.resources.length === 1 ? transformedVars : vars);

    const pluginData = menu_data_response.data.data.plugins;

    const myObjectTemplate = {
      name: null,
      objectTypes: []
    }

    // interate through plugin objects, arranging them in sorted plugin -> objectType -> object order 

    const results = [];
    for (const p of pluginData) {
      const myObject = { ...myObjectTemplate };
      myObject.name = p.objectName;

      const objectTypes = [];
      for (const object of p.objects) {
        objectTypes.push(object.objectType.name);
      }
      const uniqueObjectTypes = objectTypes.filter(onlyUnique);
      uniqueObjectTypes.sort();

      const objectTypeResults = [];
      for (const objectType of uniqueObjectTypes) {
        const objects = [];
        for (const object of p.objects) {
          if (object.objectType.name === objectType) {
            if (object.isEnabled) {
              objects.push ({name: object.name, description: object.description, enabled: object.isEnabled, visible: object.isVisible, id: object.id, indicators: object.indicators});
            }
          }
        }
        objectTypeResults.push({name: objectType, objects: objects});
      }
      myObject.objectTypes = objectTypeResults;

      results.push(myObject);
    }

    result.data = results

  } catch(error) {
    const { response } = error;
    result.errors = [error]
  };
  return result;
}, (vars, transformedVars) => {
  const actualVariables = vars.resources.length === 1 ? transformedVars : vars;
  const g = actualVariables.resources[0].deviceNames.names[0];
  return g;
})

async function fetchData(variables: VariablesType): Promise<DataType | {}> {
  const transformedVars = {
    ...variables,
    deviceResourceFilter: {
      deviceNames: []
    }
  };

  const resourceNames = [];
  if (variables.resources.length === 1) {
    if (variables.resources[0].type === 'DEVICE_NAME') {
      transformedVars.deviceResourceFilter.deviceNames = [];
      variables.resources.forEach((res) => {
        res.deviceNames.names.forEach((name) => {
          transformedVars.deviceResourceFilter.deviceNames.push(name);
        });
      });
    }
  }

  /*
  *  retrieve the performance metric data for every indicator for the selected object
  */

  const PMQuery = `query ( $datasourceId: Int, $PMResources: PMResourceArgs!, $timeSpan: PMTimeSpanArgs ){
    pm ( 
      datasourceId: $datasourceId
      resources: [$PMResources]
      timeSpan: $timeSpan
    )
    {
      timeRanges {
        startTime
        endTime
      }
      indicators {
        deviceId
        deviceName
        deviceDisplayName
        device {
          timezone
        }
        indicatorId
        indicatorTypeId
        indicatorName: indicatorTypeName
        indicatorTypeDescription
        metadata {
          attributeId
          attribute
          namespace
          entityType
          values
        }
        objectId
        objectDisplayName
        objectName
        objectDescription
        objectTypePath
        objectTypeId
        pluginId
        pluginName
        pluginObjectName
        frequency
        indicatorData {
          data {
            time
            value
            focus
          }
          postData {
            time
            value
            focus
          }
          preData {
            time
            value
            focus
          }
          total
          avgY
          maxX
          minX
          maxY
          minY
          maxYCap
          unit
        }
      }
    }
  }`;

  var menu_data = {};
  menu_data = await getMenuData(variables, transformedVars);

  /*
   * get indicator data for pm charts
   */
  var pmData = [];
  if (!isEmpty(variables.selectedObject)){
    // console.log(variables);
    pmData = await request.query(PMQuery, variables).then((response) => { 

      // only return indicators with values
      const resp_data = [];
      for ( const i of response.data.data.pm.indicators) {
        if (!isEmpty (i.indicatorData.data)) {
          resp_data.push(i);
        }
      }
/*
      console.log("resp_data", resp_data);
      console.log("full response", response.data.data);
*/
      return { data: { 'pm': { 'indicators': resp_data, 'timeRanges': response.data.data.pm.timeRanges}}}
      //return { data: response.data.data }

    }).catch((error) => {

      const { response } = error;
  
      return {
        errors: response?.data?.errors || [ {
          code: 'ServerError',
          message: ''
        } ]
      };
    });
  } 

  const deviceMetaQuery = `query ($datasourceId: Int, $deviceFilter: DeviceFilter) {
    devices(
      datasourceId: $datasourceId
      filter:$deviceFilter
    ) 
    {
      name
      ipAddress
      pollFrequency
    }
  }`;

  var metaData = {}
  metaData = await request.query(deviceMetaQuery, variables).then((response) => {
    return { data: response.data.data }
  });

  /*
  console.log("pmData returned:", pmData);
  console.log("menu data:", menu_data);
  */

  return [ menu_data, pmData, metaData ];
}


function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

export default fetchData;