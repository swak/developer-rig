import * as React from 'react';
import { ExtensionView } from '../extension-view';
import { ExtensionViewButton } from '../extension-view-button';
import { ExtensionMode } from '../constants/extension-coordinator';
import './component.sass';
import { RigExtensionView, RigExtension } from '../core/models/rig';

interface ExtensionViewContainerProps {
  channelId: string;
  mode: string;
  extensionViews: RigExtensionView[];
  openEditViewHandler?: (id: string) => void;
  deleteExtensionViewHandler: (id: string) => void;
  openExtensionViewHandler: Function;
  extension: RigExtension;
}

type Props = ExtensionViewContainerProps;

export class ExtensionViewContainer extends React.Component<Props> {
  private openExtensionViewDialog = () => {
    this.props.openExtensionViewHandler();
  }

  public render() {
    if (this.props.mode !== ExtensionMode.Viewer) {
      const configType = this.props.mode === ExtensionMode.Config ? ExtensionMode.Config : ExtensionMode.Dashboard;
      return (<ExtensionView
        id={this.props.mode}
        channelId={this.props.channelId}
        type={configType}
        extension={this.props.extension}
        mode={this.props.mode}
        key={this.props.mode}/>
      );
    }

    let extensionViews: JSX.Element[] = [];
    if (this.props.extensionViews && this.props.extensionViews.length > 0) {
      extensionViews = this.props.extensionViews.map(view => {
        return <ExtensionView
          key={view.id}
          id={view.id}
          channelId={this.props.channelId}
          extension={view.extension}
          type={view.type}
          mode={this.props.mode}
          role={view.role}
          frameSize={view.frameSize}
          position={{x: view.x, y: view.y}}
          linked={view.linked}
          orientation={view.orientation}
          openEditViewHandler={this.props.openEditViewHandler}
          deleteViewHandler={this.props.deleteExtensionViewHandler}/>
      });
    }

    return (
      <div className='view-container-wrapper'>
          <div className="view-container">
          { extensionViews }
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
