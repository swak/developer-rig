import * as React from 'react';
import './component.sass';
import { ExtensionMode } from '../constants/extension-coordinator';
import { ExtensionView } from '../extension-view';
import { ExtensionViewButton } from '../extension-view-button';
import { RigExtensionView } from '../core/models/rig';

interface Props {
  extensionViews: RigExtensionView[];
  openEditViewHandler?: (id: string) => void;
  deleteExtensionViewHandler: (id: string) => void;
  isLocal: boolean;
  openExtensionViewHandler: Function;
}

interface State {
  mockTriggersEnabled: boolean;
}

const ConfigNames: { [key: string]: string; } = {
  [ExtensionMode.Config]: 'Broadcaster Configuration',
  [ExtensionMode.Dashboard]: 'Broadcaster Live Dashboard',
};

export class ExtensionViewContainer extends React.Component<Props, State> {
  public state: State = {
    mockTriggersEnabled: false,
  };

  private openExtensionViewDialog = () => {
    this.props.openExtensionViewHandler();
  }

  private toggleMockTriggers = () => {
    this.setState((previousState) => ({ mockTriggersEnabled: !previousState.mockTriggersEnabled }));
  }

  public render() {
    let extensionViews: JSX.Element[] = [];
    if (this.props.extensionViews && this.props.extensionViews.length > 0) {
      extensionViews = this.props.extensionViews.map((view) => ((
        <ExtensionView
          key={view.id}
          id={view.id}
          channelId={view.channelId}
          extension={view.extension}
          installationAbilities={view.features}
          type={view.type}
          mode={view.mode}
          role={view.mode === ExtensionMode.Viewer ? view.role : ConfigNames[view.mode]}
          frameSize={view.frameSize}
          position={{ x: view.x, y: view.y }}
          linked={view.linked}
          isLocal={this.props.isLocal}
          isPopout={view.isPopout}
          orientation={view.orientation}
          openEditViewHandler={this.props.openEditViewHandler}
          deleteViewHandler={this.props.deleteExtensionViewHandler}
          mockApiEnabled={this.state.mockTriggersEnabled}
        />
      )));
    }
    const triggerHandleClassName = "trigger-bar__switch-handle" +
      (this.state.mockTriggersEnabled ? ' trigger-bar__switch-handle--on' : '');
    return (
      <div className='view-container-wrapper'>
        <div className="trigger-bar">
          <div className="trigger-bar__switch" onClick={this.toggleMockTriggers}>
            <div className={triggerHandleClassName}>{this.state.mockTriggersEnabled ? 'on' : 'off'}</div>
          </div>
          <div className="trigger-bar__text">Use Mock Triggers</div>
          <button className="trigger-bar__button">Edit Responses</button>
        </div>
        <div className="view-container">
          {extensionViews}
        </div>
        <div>
          <ExtensionViewButton
            onClick={this.openExtensionViewDialog}>
          </ExtensionViewButton>
        </div>
      </div>
    );
  }
}
