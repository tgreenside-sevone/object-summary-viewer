import * as React from 'react';
import styled from 'styled-components';
import isEmpty from 'lodash-es/isEmpty';
import { messages, FacetType } from '@sevone/insight-wdk';
import { ResourceSelection } from '@sevone/insight-connect';
import { Button } from '@sevone/scratch';
import { FacetWarning } from '@sevone/insight-widget-components';
import { resourcePaths } from './resource-paths';
import { consumedFacets } from '../../../facets';
import { ConfigurationType } from '../../default-configuration';

type ResourceSelectionType = React.ComponentProps<typeof ResourceSelection>;

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
const TitleWrapper = styled.div`
  font-size: calc(var(--sev1-size) * .8);
  display: flex;
  align-items: center;
  margin-bottom: calc(var(--sev1-size) * 0.5);
`;
const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

type Props = {
  configuration: ConfigurationType,
  onMessage: (message: string, payload: any) => void
  facets: Array<FacetType>
}

type State = {
  datasource: ResourceSelectionType['datasource'],
  value: ResourceSelectionType['value'],
  hierarchicalData: ResourceSelectionType['hierarchicalData']
};

class ResourceSettings extends React.Component<Props, State> {
  static title = 'Data';

  state = {
    datasource: this.props.configuration.datasourceId,
    value: !isEmpty(this.props.configuration.resources) ? this.props.configuration.resources[0] : null,
    hierarchicalData: this.props.configuration.resourceHierarchicalData
  };

  handleChange: ResourceSelectionType['onChange'] = (
    datasource,
    value,
    hierarchicalData
  ) => {
    this.setState({ datasource, value, hierarchicalData});
  }

  handleRun = () => {
    const { onMessage } = this.props;
    const { datasource, value, hierarchicalData } = this.state;
    const datasourceId = Array.isArray(datasource) ? datasource[0] : datasource;

    onMessage(messages.updateConfiguration, {
      datasourceId,
      resources: [ value ],
      resourceHierarchicalData: hierarchicalData
    });
  }

  render() {
    const { configuration, facets } = this.props;
    const { datasource, value, hierarchicalData } = this.state;

    return (
      <Container>
        <FacetWarning facets={facets} schemas={[ consumedFacets.resources ]} />
        <TitleWrapper>
          {'Select your resources'}
        </TitleWrapper>
        <ResourceSelection
          allowedPaths={resourcePaths}
          datasource={datasource}
          value={value}
          hierarchicalData={hierarchicalData}
          onChange={this.handleChange}
        />
        <ButtonContainer>
          <Button
            onClick={this.handleRun}
            disabled={(isEmpty (value)? true : value.resources.length===0 ? true: value.resources.length>1? true: false)}
          >
            {'Run'}
          </Button>
        </ButtonContainer>
      </Container>
    );
  }
}

export default ResourceSettings;
