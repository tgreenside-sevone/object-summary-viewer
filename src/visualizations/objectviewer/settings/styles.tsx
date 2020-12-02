import * as React from 'react';
import styled from 'styled-components';
import { Checkbox } from '@sevone/scratch';
import { messages } from '@sevone/insight-wdk';
import { ConfigurationType } from '../../../default-configuration';

const Container = styled.div`
  display: flex;

  & > * {
    margin: 0 15px;
  }
`;
const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;
const SettingsWrapper = styled.div`
  padding: 2px 0;
`;
const TooltipSettingsWrapper = styled.div`
  margin-left: 15px;
`;

type Props = {
  configuration: ConfigurationType,
  onMessage: (message: string, payload: any) => void
}

Styles.title = 'Styles';
function Styles(props: Props) {
  const { configuration, onMessage } = props;
  const { line: settings } = configuration.vizSettings;
  const { title, tooltip } = settings;
  const selectedInfo = new Set(tooltip.columns);

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

  const handleShowTooltipChange = (value: boolean) => {
    onMessage(messages.updateConfiguration, {
      vizSettings: {
        ...configuration.vizSettings,
        line: {
          ...configuration.vizSettings.line,
          tooltip: {
            ...configuration.vizSettings.line.tooltip,
            show: value
          }
        }
      }
    });
  };

  return (
    <Container>
      <SectionWrapper>
        <SettingsWrapper>
          <Checkbox
            onChange={handleHighlightAreaChange}
            checked={settings.area}
          >
            {'Highlight the area under the line'}
          </Checkbox>
        </SettingsWrapper>
        <SettingsWrapper>
          <Checkbox
            onChange={handleSmoothLineChange}
            checked={settings.smooth}
          >
            {'Smooth line'}
          </Checkbox>
        </SettingsWrapper>
      </SectionWrapper>
      <SectionWrapper>
        <div>
          <SettingsWrapper>
            <Checkbox
              onChange={handleShowTooltipChange}
              checked={tooltip.show}
            >
              {'Show tooltip'}
            </Checkbox>
          </SettingsWrapper>
          <TooltipSettingsWrapper>
            <SettingsWrapper>
              <Checkbox
                onChange={handleShowCrossChange}
                checked={tooltip.showCross}
                disabled={!tooltip.show}
              >
                {'Show Cross'}
              </Checkbox>
            </SettingsWrapper>
          </TooltipSettingsWrapper>
        </div>
      </SectionWrapper>
    </Container>
  );
}

export { Styles };
