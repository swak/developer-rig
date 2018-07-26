import * as React from 'react';
import { ExtensionFrame } from '../extension-frame';
import { MobileOrientation } from '../constants/mobile';
import { RigExtension, FrameSize } from '../core/models/rig';
import { Position } from '../types/extension-coordinator';
import { ExtensionMode, ExtensionViewType} from '../constants/extension-coordinator';

const ViewBackgroundColor = '#322F37';
const AbsolutePosition = 'absolute';

interface ExtensionMobileViewProps {
  id: string;
  channelId: string;
  orientation: string;
  extension: RigExtension;
  frameSize: FrameSize;
  position: Position
  role: string;
  bindIframeToParent: (iframe: HTMLIFrameElement) => void;
}
type Props = ExtensionMobileViewProps & React.HTMLAttributes<HTMLDivElement>;

export class ExtensionMobileView extends React.Component<Props> {
  public computeFrameStyles(): React.CSSProperties {
    let frameStyles: React.CSSProperties;

    if (this.props.orientation === MobileOrientation.Portrait) {
      const height = Math.floor(this.props.frameSize.height * 0.65);
      frameStyles = {
        width: `${this.props.frameSize.width}px`,
        height: `${height}px`,
        bottom: '0'
      }
    } else {
      const width = Math.floor(this.props.frameSize.height * 0.28);
      frameStyles = {
        width: `${width}px`,
        height: `${this.props.frameSize.width}px`,
        right: '0'
      }
    }

    frameStyles.position = AbsolutePosition;
    return frameStyles;
  }

  public computeViewStyles() {
    let viewStyles: React.CSSProperties;
    if (this.props.orientation === MobileOrientation.Portrait) {
      viewStyles = {
        width: this.props.frameSize.width + 'px',
        height: this.props.frameSize.height + 'px',
      }
    } else {
      viewStyles = {
        width: this.props.frameSize.height + 'px',
        height: this.props.frameSize.width + 'px',
      }
    }

    viewStyles.background = ViewBackgroundColor;
    return viewStyles;
  }
  public render() {
    return (
      <div
        className="view component-view"
        style={this.computeViewStyles()}>
          <div style={this.computeFrameStyles()}>
          <ExtensionFrame
            bindIframeToParent={this.props.bindIframeToParent}
            className="view"
            channelId={this.props.channelId}
            frameId={`frameid-${this.props.id}`}
            extension={this.props.extension}
            type={ExtensionViewType.Mobile}
            mode={ExtensionMode.Viewer}
          />
        </div>
      </div>
    );
  }
}
