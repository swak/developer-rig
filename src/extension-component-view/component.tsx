import * as React from 'react';
import { ExtensionFrame } from '../extension-frame';
import { RigExtension, FrameSize } from '../core/models/rig';
import { Position } from '../types/extension-coordinator';
import { ExtensionMode, ExtensionViewType } from '../constants/extension-coordinator';
const { getComponentPositionFromView, getComponentSizeFromView } = window['extension-coordinator'];

interface ExtensionComponentViewProps {
  id: string
  channelId: string;
  extension: RigExtension;
  frameSize: FrameSize;
  position: Position;
  role: string;
  bindIframeToParent: (iframe: HTMLIFrameElement) => void;
}

type Props = ExtensionComponentViewProps & React.HTMLAttributes<HTMLDivElement>;

export class ExtensionComponentView extends React.Component<Props> {
  private computeViewStyles(): React.CSSProperties {
    const extension = this.props.extension;
    const positionFromView = getComponentPositionFromView(
      this.props.frameSize.width,
      this.props.frameSize.height,
      {
        x: this.props.position.x * 100,
        y: this.props.position.y * 100,
      });
    const sizeFromView = getComponentSizeFromView(
      this.props.frameSize.width,
      this.props.frameSize.height,
      extension.views.component);

    let viewStyles:  React.CSSProperties = {
      border: '1px solid #7D55C7',
      position: 'absolute',
      left: positionFromView.x + 'px',
      top: positionFromView.y + 'px',
      width: `${sizeFromView.width}px`,
      height: `${sizeFromView.height}px`,
    }

    if (extension.views.component.zoom) {
      viewStyles = {
        ...viewStyles,
        width: `${sizeFromView.width / sizeFromView.zoomScale}px`,
        height: `${sizeFromView.height / sizeFromView.zoomScale}px`,
        transformOrigin: '0 0',
        transform: `scale(${sizeFromView.zoomScale})`,
      }
    }

    return viewStyles;
  }

  public render() {
    return (
      <div
        className="view component-view nono_zone"
        style={{
          width: this.props.frameSize.width + 'px',
          height: this.props.frameSize.height + 'px',
        }}>
          <div style={this.computeViewStyles()}>
          <ExtensionFrame
            bindIframeToParent={this.props.bindIframeToParent}
            className="view"
            channelId={this.props.channelId}
            frameId={`frameid-${this.props.id}`}
            extension={this.props.extension}
            type={ExtensionViewType.Component}
            mode={ExtensionMode.Viewer}
          />
        </div>
      </div>
    );
  }
}
