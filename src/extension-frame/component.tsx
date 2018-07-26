import * as React from 'react';
import './component.sass';
import { RigExtension } from '../core/models/rig';
import { ExtensionPlatform, ExtensionViewType } from '../constants/extension-coordinator';

const IFRAME_CLASS = 'extension-frame';
const EXTENSION_FRAME_INIT_ACTION = 'extension-frame-init';

interface ExtensionFrameProps {
  channelId: string;
  className: string;
  frameId: string;
  extension: RigExtension;
  type: string;
  mode: string;
  bindIframeToParent: (iframe: HTMLIFrameElement) => void;
}

type Props = ExtensionFrameProps;

export class ExtensionFrame extends React.Component<Props> {
  public iframe: HTMLIFrameElement;

  public componentDidMount() {
    if (this.iframe) {
      this.iframe.onload = this.extensionFrameInit;
    }
  }

  public render() {
    return (
      <iframe
        ref={this.bindIframeRef}
        src={process.env.PUBLIC_URL + '/extension-frame.html'}
        frameBorder={0}
        className={'rig-frame ' + IFRAME_CLASS}
        title={this.props.frameId} />
    );
  }

  private bindIframeRef = (iframe: HTMLIFrameElement) => {
    this.iframe = iframe;
    this.props.bindIframeToParent(iframe);
  }

  public extensionFrameInit = () => {
    const extension: any = {
      anchor: this.props.type,
      channelId: this.props.channelId,
      loginId: null,
      extension: this.props.extension,
      mode: this.props.mode,
      platform: (this.props.type === ExtensionViewType.Mobile) ? ExtensionPlatform.Mobile : ExtensionPlatform.Web,
      trackingProperties: {},
      iframeClassName: IFRAME_CLASS,
    }
    const data = {
      extension: extension,
      action: EXTENSION_FRAME_INIT_ACTION,
      frameId: this.props.frameId,
    }
    this.iframe.contentWindow.postMessage(data, '*');
  }
}
