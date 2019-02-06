import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { NO_PORTS_FOUND as NO_PORTS_FOUND_ERRCODE } from '../../shared/errorCodes';
import { ENUMERATING_PORTS, NO_PORTS_FOUND } from '../../shared/messages';

class PortSelect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ports: null,
    };

    this.onPortChanged = this.onPortChanged.bind(this);
    this.onRefreshPortsClicked = this.onRefreshPortsClicked.bind(this);
    this.changePort = this.changePort.bind(this);
  }

  componentDidMount() {
    this.getPorts();
  }

  onPortChanged(event) {
    const selectedPort = R.find(
      R.propEq('comName', event.target.value),
      this.state.ports
    );
    this.changePort(selectedPort);
  }

  onRefreshPortsClicked() {
    this.getPorts();
  }

  getPorts() {
    this.setState({ ports: null });

    this.props
      .listPorts()
      .catch(
        err =>
          err.errorCode === NO_PORTS_FOUND_ERRCODE ? [] : Promise.reject(err)
      )
      .then(R.tap(ports => this.setState({ ports })))
      .then(ports => {
        const hasSelectedPort = R.contains(this.props.selectedPort, ports);
        const defaultPort = ports && ports.length > 0 ? ports[0] : null;
        const defaultPreferredPort = R.compose(
          R.defaultTo(defaultPort),
          R.find(
            R.compose(
              R.test(
                /^(\/dev\/ttyUSB|\/dev\/tty.usb|\/dev\/cu.usb|\/dev\/ttyACM)/i
              ),
              R.prop('comName')
            )
          )
        )(ports);

        if (!hasSelectedPort) {
          this.changePort(defaultPreferredPort);
        }
      });
  }

  getSelectedPortName() {
    return R.compose(R.propOr('', 'comName'))(this.props.selectedPort);
  }

  changePort(port) {
    this.props.onPortChanged(port);
  }

  render() {
    const isSelecting = this.state.ports === null;
    const hasPorts = this.state.ports !== null && this.state.ports.length > 0;

    const select = hasPorts ? (
      <select
        id="targetPort"
        className="inspectorSelectInput inspectorInput--full-width"
        onChange={this.onPortChanged}
        value={this.getSelectedPortName()}
      >
        {this.state.ports.map(port => (
          <option key={port.comName} value={port.comName}>
            {port.comName} {port.manufacturer ? `(${port.manufacturer})` : ''}
          </option>
        ))}
      </select>
    ) : (
      <select id="targetPort" className="inspectorSelectInput" disabled>
        <option>
          {this.state.ports === null ? ENUMERATING_PORTS : NO_PORTS_FOUND}
        </option>
      </select>
    );

    return (
      <React.Fragment>
        <label htmlFor="targetPort">Serial port:</label>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          {select}
          <button
            className="Button Button--small"
            style={{ marginLeft: '1em' }}
            onClick={this.onRefreshPortsClicked}
            disabled={isSelecting}
          >
            Refresh
          </button>
        </div>
      </React.Fragment>
    );
  }
}

PortSelect.propTypes = {
  selectedPort: PropTypes.object,
  listPorts: PropTypes.func,
  onPortChanged: PropTypes.func,
};

PortSelect.defaultProps = {
  isDeploymentInProgress: false,
};

export default PortSelect;
