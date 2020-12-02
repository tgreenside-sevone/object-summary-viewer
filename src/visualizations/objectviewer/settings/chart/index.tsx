import * as React from 'react';
import styled from 'styled-components';
import { Checkbox, FormGroup } from '@sevone/scratch';
import { messages } from '@sevone/insight-wdk';
import { SubSettings } from '@sevone/insight-widget-components';
import { ConfigurationType } from '../../../../default-configuration';
import { DataType } from '../../../../fetch-data';

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
const Section = styled.div`
  display: flex;
  flex-direction: row;
`;

type Props = {
  data: DataType
  onMessage: (message: string, payload: any) => void
  configuration: ConfigurationType,
}

function Chart(props: Props) {
  const { configuration, onMessage } = props;
  const { line: settings } = configuration.vizSettings;
 
  const { tooltip } = settings;

  const handleHighlightAreaChange = (value: boolean) => {
    onMessage(messages.updateConfiguration, {
      vizSettings: {
        ...configuration.vizSettings,
        line: {
          ...configuration.vizSettings.line,
          area: value
        }
      }
    });
  };

  const handleSmoothLineChange = (value: boolean) => {
    onMessage(messages.updateConfiguration, {
      vizSettings: {
        ...configuration.vizSettings,
        line: {
          ...configuration.vizSettings.line,
          smooth: value
        }
      }
    });
  };

  const handleShowCrossChange = (value: boolean) => {
    onMessage(messages.updateConfiguration, {
      vizSettings: {
        ...configuration.vizSettings,
        line: {
          ...configuration.vizSettings.line,
          tooltip: {
            ...configuration.vizSettings.line.tooltip,
            showCross: value
          }
        }
      }
    });
  };

  const handleShowSymbolChange = (value: boolean) => {
    onMessage(messages.updateConfiguration, {
      vizSettings: {
        ...configuration.vizSettings,
        line: {
          ...configuration.vizSettings.line,
          showSymbol: value
        }
      }
    });
  };

  return (
    <SettingsContainer>
      <Section>
        <div style={{ flex: 1 }}>
          <SubSettings>
            <FormGroup>
              <Checkbox
                onChange={handleHighlightAreaChange}
                checked={settings.area}
              >
                {'Area'}
              </Checkbox>
            </FormGroup>
          </SubSettings>
          <FormGroup>
            <Checkbox
              onChange={handleSmoothLineChange}
              checked={settings.smooth}
            >
              {'Smooth line'}
            </Checkbox>
          </FormGroup>
        </div>
      </Section>
      <Checkbox
        onChange={handleShowSymbolChange}
        checked={settings.showSymbol}
      >
        {'Enable line symbol'}
        </Checkbox>
      <Checkbox
          onChange={handleShowCrossChange}
          checked={tooltip.showCross}
          disabled={!tooltip.show}
        >
          {'Show Cross'}
        </Checkbox>
    </SettingsContainer>
  );
}
Chart.title = 'Line Visualizations';

export { Chart };
