import * as React from 'react';
import { ExtensionView } from '../extension-view';
import { ExtensionViewButton } from '../extension-view-button';
import { ExtensionMode } from '../constants/extension-coordinator';
import './component.sass';
import { RigExtensionView } from '../core/models/rig';

interface ExtensionViewContainerProps {
  extensionViews: RigExtensionView[];
  openEditViewHandler?: (id: string) => void;
  deleteExtensionViewHandler: (id: string) => void;
  isLocal: boolean;
  openExtensionViewHandler: Function;
  mockApiEnabled: boolean;
}

const ConfigNames: { [key: string]: string; } = {
  [ExtensionMode.Config]: 'Broadcaster Configuration',
  [ExtensionMode.Dashboard]: 'Broadcaster Live Dashboard',
};

export class ExtensionViewContainer extends React.Component<ExtensionViewContainerProps> {
  private openExtensionViewDialog = () => {
    this.props.openExtensionViewHandler();
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
          mockApiEnabled={this.props.mockApiEnabled}
        />
      )));
    }

    return (
      <div className='view-container-wrapper'>
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
