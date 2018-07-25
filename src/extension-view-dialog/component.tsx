import * as React from 'react';
import './component.sass';
import { ExtensionAnchors, DefaultExtensionType } from '../constants/extension-types'
import { OverlaySizes, DefaultOverlaySize, DefaultCustomDimensions } from '../constants/overlay-sizes'
import { ViewerTypes, DefaultViewerType } from '../constants/viewer-types'
import { IdentityOptions, DefaultIdentityOption } from '../constants/identity-options';
import { ViewTypeImages } from '../constants/img-map';
import { RadioOption } from './radio-option';
import { DivOption } from './div-option';
import * as closeButton from '../img/close_icon.png';
import { MobileOrientation, DefaultMobileOrientation, MobileSizes } from '../constants/mobile';
import { ManifestViews, getSupportedAnchors, getSupportedPlatforms } from '../core/models/manifest';
import { ExtensionPlatform, ExtensionAnchor} from '../constants/extension-coordinator';

interface ExtensionViewDialogProps {
  extensionViews: ManifestViews,
  closeHandler: Function,
  saveHandler: Function,
  show?: boolean,
}

interface State {
  extensionViewType: ExtensionAnchor | ExtensionPlatform;
  frameSize: string;
  viewerType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  identityOption: string;
  orientation: string;
  opaqueId: string;
  [key: string]: number | string;
}

const InitialState = {
  extensionViewType: DefaultExtensionType,
  frameSize: DefaultOverlaySize,
  viewerType: DefaultViewerType,
  x: 0,
  y: 0,
  width: DefaultCustomDimensions.width,
  height: DefaultCustomDimensions.height,
  identityOption: DefaultIdentityOption,
  orientation: DefaultMobileOrientation,
  opaqueId: '',
};

export class ExtensionViewDialog extends React.Component<ExtensionViewDialogProps, State> {
  public state: State = {
    ...InitialState,
    extensionViewType: getSupportedAnchors(this.props.extensionViews)[0],
  }

  public onChange = (input: React.FormEvent<HTMLInputElement>) => {
    this.setState({
      [input.currentTarget.name]: input.currentTarget.value,
    });
  }

  private renderExtensionTypeComponents() {
    const allowedAnchors = getSupportedAnchors(this.props.extensionViews);
    const allowedPlatforms = getSupportedPlatforms(this.props.extensionViews);

    const onlyOneOption = allowedAnchors.length + allowedPlatforms.length === 1;
    const divOptions = allowedAnchors.map((key: string, index: number) => (
      <DivOption
        key={key}
        img={this.state.extensionViewType === key ? ViewTypeImages[key].on : ViewTypeImages[key].off}
        name={ExtensionAnchors[key]}
        value={key}
        onChange={this.onChange}
        checked={onlyOneOption || this.state.extensionViewType === key}
      />
    ));

    if (allowedPlatforms.indexOf(ExtensionPlatform.Mobile) !== -1) {
      divOptions.push((
        <DivOption
          key={ExtensionPlatform.Mobile}
          img={this.state.extensionViewType === ExtensionPlatform.Mobile ? ViewTypeImages[ExtensionPlatform.Mobile].on : ViewTypeImages[ExtensionPlatform.Mobile].off}
          name={ExtensionAnchors[ExtensionPlatform.Mobile]}
          value={ExtensionPlatform.Mobile}
          onChange={this.onChange}
          checked={onlyOneOption || this.state.extensionViewType === ExtensionPlatform.Mobile}
        />
      ))
    }
    return divOptions;
  }

  private renderFrameSizeComponents() {
    return Object.keys(OverlaySizes).map(key => {
      return <RadioOption key={key} name="frameSize" value={key} onChange={this.onChange} checked={key === this.state.frameSize}/>
    });
  }

  private renderMobileFrameSizeComponents() {
    return Object.keys(MobileSizes).map(key => {
      return <RadioOption key={key} name="frameSize" value={key} onChange={this.onChange} checked={key === this.state.frameSize}/>
    });
  }

  private renderViewerTypeComponents() {
    return Object.keys(ViewerTypes).map(key => {
      return <RadioOption key={key} name="viewerType" value={ViewerTypes[key]} onChange={this.onChange} checked={ViewerTypes[key] === this.state.viewerType}/>
    });
  }

  private renderIdentityOptionComponents() {
    return Object.keys(IdentityOptions).map(option => {
      return <RadioOption key={option} name="identityOption" value={option} onChange={this.onChange} checked={option === this.state.identityOption}/>
    });
  }

  private renderOrientationComponents() {
    return Object.keys(MobileOrientation).map(option => {
      return <RadioOption key={option} name="orientation" value={MobileOrientation[option]} onChange={this.onChange} checked={option === this.state.orientation}/>
    });
  }

  private close = () => {
    this.setState(InitialState);
    this.props.closeHandler();
  }

  save = () => {
    this.props.saveHandler(this.state);
  }

  public render() {
    if (!this.props.show) {
      return null;
    }
    return (
      <div className="new-extension-view">
        <div className="new-extension-view__background" />
        <div className="new-extension-view__dialog">
          <div className="dialog__top-bar-container">
            <div className="top-bar-container__title"> Add a new view </div>
            <div className="top-bar-container__escape" onClick={this.close}><img alt="Close" src={closeButton}/></div>
          </div>

          <hr className="dialog__divider" />

          <div className="dialog__type-and-size-container">
            <div className="type-title__type-container">
              <div className="type-and-size-container__type-title">
                Extension Type
              </div>
              <div className='dialog__type-container'>
                {this.renderExtensionTypeComponents()}
              </div>
            </div>

            <div className="type-and-size-container__size-title">
              <div className="size-title__size-subcontainer">

                {(this.state.extensionViewType === ExtensionAnchor.Overlay) &&
                <div className="size-title__size-subcontainer">
                  <div className="size-subcontainer__presets">
                    <div className="type-and-size-container__type-title">
                      Overlay Size
                    </div>
                    <div className='size-subcontainer__presets-container'>
                      <div className='size-subcontainer__size-selection'>
                        {this.renderFrameSizeComponents()}
                      </div>
                      <div className='overlay-custom-container'>
                          <RadioOption className='overlay-custom' name="frameSize" value="Custom" onChange={this.onChange} checked={"Custom" === DefaultIdentityOption} />
                        <div className='overlay-custom-container'>
                          <div className="custom-subcontainer__input">
                            <label className="inputs__option-label inputs__width-offset"> Width </label>
                            <input type="text" name="width" onChange={this.onChange}/>
                          </div>
                          <div className="custom-subcontainer__input">
                            <label className="inputs__option-label"> Height </label>
                            <input type="text" name="height" onChange={this.onChange}/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>}

                {(this.state.extensionViewType === ExtensionPlatform.Mobile) &&
                <div className="size-title__size-subcontainer">
                  <div className="size-subcontainer__presets">
                    <div className="type-and-size-container__type-title">
                      Screen Size
                    </div>
                    <div className='size-subcontainer__presets-container'>
                      <div className='size-subcontainer__size-selection'>
                        {this.renderMobileFrameSizeComponents()}
                      </div>
                      <div className='overlay-custom-container'>
                          <RadioOption className='overlay-custom' name="frameSize" value="Custom" onChange={this.onChange} checked={"Custom" === DefaultIdentityOption} />
                        <div className='overlay-custom-container'>
                          <div className="custom-subcontainer__input">
                            <label className="inputs__option-label inputs__width-offset"> Width </label>
                            <input type="text" name="width" onChange={this.onChange}/>
                          </div>
                          <div className="custom-subcontainer__input">
                            <label className="inputs__option-label"> Height </label>
                            <input type="text" name="height" onChange={this.onChange}/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="size-subcontainer__presets">
                    <div className="type-and-size-container__type-title">
                      Orientation
                    </div>
                    <div className='overlay-custom-container'>
                      {this.renderOrientationComponents()}
                    </div>
                  </div>
                </div>
                }

                {(this.state.extensionViewType === ExtensionAnchor.Component) &&
                  <div className="size-subcontainer__presets">
                    <div className="type-and-size-container__type-title">
                      Player Size
                    </div>
                    <div className='size-subcontainer__presets-container'>
                      <div className='size-subcontainer__size-selection'>
                        {this.renderFrameSizeComponents()}
                      </div>
                      <div className='overlay-custom-container'>
                          <RadioOption className='overlay-custom' name="frameSize" value="Custom" onChange={this.onChange} checked={"Custom" === DefaultIdentityOption} />
                        <div className='overlay-custom-container'>
                          <div className="custom-subcontainer__input">
                            <label className="inputs__option-label inputs__width-offset"> Width </label>
                            <input type="text" name="width" onChange={this.onChange}/>
                          </div>
                          <div className="custom-subcontainer__input">
                            <label className="inputs__option-label"> Height </label>
                            <input type="text" name="height" onChange={this.onChange}/>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>}

                {(this.state.extensionViewType === ExtensionAnchor.Component) &&
                  <div className="size-subcontainer__presets">
                    <div className="type-and-size-container__type-title">
                      Position (%)
                    </div>
                    <div className='overlay-custom-container'>
                      <div className='overlay-custom-container'>
                        <div className="custom-subcontainer__input">
                          <label className="inputs__option-label">X</label>
                          <input type="text" name="x" placeholder='0 - 100' onChange={this.onChange} />
                        </div>
                        <div className="custom-subcontainer__input">
                          <label className="inputs__option-label">Y</label>
                          <input type="text" name="y" placeholder='0 - 100' onChange={this.onChange} />
                        </div>
                      </div>
                    </div>
                  </div>}
              </div>
            </div>
          </div>
          <div className="dialog__viewer-container">
            <div className="type-title__type-container">
              <div className="type-and-size-container__type-title">
                Viewer Type
              </div>
              <div className='dialog__type-container'>
                {this.renderViewerTypeComponents()}
                <div>
                  {(this.state.viewerType === ViewerTypes.LoggedIn) ?
                    this.renderIdentityOptionComponents() : null}
                </div>
                <div className='opaque_id-input'>
                  <label className="opaque-id-label">Custom Opaque ID</label>
                  <input type="text" name="opaqueId" onChange={this.onChange}/>
                </div>
              </div>
            </div>
          </div>
          <hr className="dialog__divider" />
          <div className="dialog_bottom-bar">
            <div className="bottom-bar__save" onClick={this.save}> Save </div>
            <div className="bottom-bar__cancel" onClick={this.close}> Cancel </div>
          </div>
        </div>
      </div>
    );
  }
}
