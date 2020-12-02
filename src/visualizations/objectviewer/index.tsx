import * as React from 'react';
import isEmpty from 'lodash-es/isEmpty';
import { Message, Menu, SubMenu, MenuItem, FolderIcon } from '@sevone/scratch';
import icon from '../../assets/icons/generic.svg';
import { ConfigurationType } from '../../default-configuration';
import styled from 'styled-components';
import { messages } from  '@sevone/insight-wdk';
import { LineChart } from '@sevone/insight-charts';
import { useTheme } from '@sevone/insight-connect';
import { abbreviateValue } from '@sevone/insight-widget-components';
import Settings from './settings';

type Props = {
  configuration: ConfigurationType,
  data: any,
  onMessage: (message: string, payload: any) => void
};

const Container = styled.div`
  width: '1024px';
  display: flex;
  flex-wrap: wrap;
`;

function ObjectViewer(props: Props) {

  const { data, configuration, onMessage } = props;
  const { line: settings } = configuration.vizSettings;
  const [ selectedpath, setSelectedpath ] = React.useState(null);
  const { theme } = useTheme();
  

  if (data[0].error) {
    return <Message type="error">{data[0].error}</Message>;
  }
  
  if (!data[0].data) {
    return <Message type="info">{'No data.'}</Message>
  }
  
  function generate_charts(data) {
    if (isEmpty (data) || isEmpty(data.data.pm.indicators)) {
      return <Message type="info">{'<< Please select an Object From the Menu'}</Message>
    } else {

      const output = data.data.pm.indicators.map(indicator => <div key={indicator.indicatorId} style={{ width: '390px', height: '200px', margin: '10px' }} className={'chart-wrapper'}><LineChart
      xAxisType={'time'}
      yAxisLeft={{
        formatter: value => abbreviateValue(value.toFixed(0)),
      }}
      yAxisScale={{
        type: 'value' as 'value'
      }}
      yAxis={{
        min: indicator.yAxisMin,
        max: indicator.yAxisMax
      }}
      xAxisMin={data.data.pm.timeRanges[0].startTime}
      xAxisMax={data.data.pm.timeRanges[0].endTime}
      xAxisFormatter={(value, index) => {
        const date = new Date(value)
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
      }}
      area={settings.area}
      legendType={"none"}
      smooth={settings.smooth}
      theme={theme}
      series={[
        {
          id: indicator.indicatorId,
          name: indicator.indicatorTypeDescription,
          data: indicator.indicatorData.data.map(val => ({ 'value' : [ val.time, val.value ]})),
          invert: false
        }
      ]}
      tooltip={settings.tooltip.show ? {
        formatter: params => {
          const tooltips = params.map(series => {
            let units = indicator.indicatorData.unit;
            let dateValue = new Date (series.data.value[0]);
            let value = abbreviateValue(series.value[1].toFixed(2));
            return `<table>
                      <tbody>
                        <tr>
                          <td></td><td>${dateValue.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td>${series.marker}</td><td>${series.seriesName}: ${value} ${units}</td>
                        </tr>
                      </tbody>
                    </table>`
          })
          return tooltips.join('</br>')
        },
        trigger: 'axis',
        showCross: settings.tooltip.showCross
      } : undefined }
      showSymbol={settings.showSymbol}
      title={indicator.indicatorTypeDescription + " (" + indicator.indicatorData.unit + ")"}
      subtitle={"Min: "+abbreviateValue(indicator.indicatorData.minY.toFixed(0))+" / Avg: "+abbreviateValue(indicator.indicatorData.avgY.toFixed(0))+" / Max: "+abbreviateValue(indicator.indicatorData.maxY.toFixed(0))}
    /></div>);
      return output;
    }
  }

  return (
    <table>
      <tbody>
        <tr>
          <td style={{verticalAlign: "top"}}>
            <Container>
              <div key='menu' style={{ width: '300px' }}>
                <Menu
                  collapsed={false}
                  mode="inline"
                  selectedPath={selectedpath}
                  onSelect={path => {
                    setSelectedpath(path);
                  }}
                >
                  {data[0].data.map(plugin => <SubMenu 
                    icon={<FolderIcon/>} 
                    key={plugin.name}
                    id={plugin.name}
                    title={plugin.name} 
                    children={plugin.objectTypes.map(ot => <SubMenu
                      icon={<FolderIcon/>}
                      key={ot.name}
                      id={ot.name} 
                      title={ot.name}
                      children={ot.objects.map(obj => 
                        <MenuItem
                          id={obj.id}
                          key={obj.id}
                          children={obj.name === obj.description ? obj.name : obj.name + " -- " +obj.description}
                          onClick={() => onMessage(messages.updateConfiguration, { selectedObject: obj})}
                        /> )}
                      />)}
                    />)}
                </Menu>
              </div>
            </Container>
          </td>
          <td width="100%" style={{verticalAlign: "top"}}>
            <table width="100%">
              <tbody>
                <tr>
                  <td width="100%" style={{verticalAlign: "top"}}>
                    <table width='100%'>
                        <tbody>
                          <tr>
                            <td width="25%">Device:</td><td width="25%">{data[2].data.devices[0].name}</td>
                            <td width="25%">Plugin:</td><td width="25%">{isEmpty (data[1]) ? null : !isEmpty (data[1].data.pm.indicators) ? data[1].data.pm.indicators[0].pluginObjectName : null}</td>
                          </tr>
                          <tr>
                            <td>IP Address:</td><td>{data[2].data.devices[0].ipAddress}</td>
                            <td>Object Name:</td><td>{isEmpty (data[1]) ? null : !isEmpty (data[1].data.pm.indicators) ? data[1].data.pm.indicators[0].objectDisplayName : null}</td>
                          </tr>
                          <tr>
                            <td></td><td></td>
                            <td>Description:</td><td>{isEmpty (data[1]) ? null : !isEmpty (data[1].data.pm.indicators) ? data[1].data.pm.indicators[0].objectDescription : null}</td>
                          </tr>

                          <tr>
                            <td>Poll Frequency:</td><td>{data[2].data.devices[0].pollFrequency} seconds</td>
                            <td>Object Type:</td><td>{isEmpty (data[1]) ? null : !isEmpty (data[1].data.pm.indicators) ? data[1].data.pm.indicators[0].objectTypePath : null}</td>
                          </tr>
                        </tbody>
                    </table>
                    <hr></hr>
                  </td>
                </tr>
                <tr>
                  <td style={{verticalAlign: "top"}}>
                    <p> </p>
                    <Container>
                      {generate_charts (data[1])}
                    </Container>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

ObjectViewer.title = 'Line';
ObjectViewer.icon = icon;
ObjectViewer.settings = Settings;

export { ObjectViewer };
