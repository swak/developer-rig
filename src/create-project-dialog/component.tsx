import * as React from 'react';
import * as closeButton from '../img/close_icon.png';
import './component.sass';
import { ExtensionManifest } from '../core/models/manifest';
import { createProject, Example, fetchExamples } from '../util/api';
import { RigProject } from '../core/models/rig';
import { fetchUserExtensionManifest } from '../util/extension';
import { generateManifest } from '../util/generate-manifest';
import { ExtensionViewType } from '../constants/extension-coordinator';

interface Props {
  userId: string;
  mustSave?: boolean;
  closeHandler: () => void;
  saveHandler: (state: RigProject) => void;
}

interface State {
  rigProject: RigProject;
  name: string;
  clientId: string;
  version: string;
  codeGenerationOption: string;
  extensionTypes: number;
  scaffoldingOptions: number;
  errorMessage?: string;
  examples: Example[];
  exampleIndex: number;
  [key: string]: number | string | RigProject | Example[];
}

enum CodeGenerationOption {
  None = 'none',
  Scaffolding = 'scaffolding',
  Template = 'template',
}

enum ScaffoldingOptions {
  None = 0,
  StoreConfiguration = 1,
  RetrieveConfiguration = 2,
}

enum ExtensionTypes {
  Panel = 1,
  Component = 2,
  Overlay = 4,
  Mobile = 8,
}

export class CreateProjectDialog extends React.Component<Props, State>{
  private initial: { isMounted: boolean } = { isMounted: false };
  public state: State = {
    rigProject: {
      isLocal: true,
      projectFolderPath: '',
      manifest: {} as ExtensionManifest,
      secret: process.env.EXT_SECRET || '',
      frontendFolderName: '',
      backendCommand: '',
    } as RigProject,
    name: '',
    clientId: process.env.EXT_CLIENT_ID || '',
    version: process.env.EXT_VERSION || '',
    codeGenerationOption: CodeGenerationOption.None,
    extensionTypes: ExtensionTypes.Panel,
    scaffoldingOptions: ScaffoldingOptions.None,
    examples: [],
    exampleIndex: 0,
  };

  public async componentDidMount() {
    this.initial.isMounted = true;
    const examples = await fetchExamples();
    if (this.initial.isMounted) {
      this.setState({ examples });
    }
  }

  public componentWillUnmount() {
    this.initial.isMounted = false;
  }

  public onChange = (input: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, checked, type, value } = input.currentTarget as HTMLInputElement;
    if (type === 'checkbox') {
      if (typeof this.state[name] === 'boolean') {
        const rigProject = Object.assign(this.state.rigProject, { [name]: checked }) as RigProject;
        this.setState({ rigProject, errorMessage: null });
      } else {
        this.setState((previousState) => {
          const previousValue = previousState[name] as number;
          const numericValue = Number(value);
          if (checked) {
            return { [name]: previousValue | numericValue, errorMessage: null };
          } else {
            return { [name]: previousValue & ~numericValue, errorMessage: null };
          }
        });
      }
    } else if (name !== 'name' || this.state.rigProject.isLocal) {
      const convert = typeof this.state[name] === 'number' ? (s: string) => Number(s) : (s: string) => s;
      if (Object.getOwnPropertyDescriptor(this.state.rigProject, name)) {
        const rigProject = Object.assign(this.state.rigProject, { [name]: convert(value) }) as RigProject;
        this.setState({ rigProject, errorMessage: null });
      } else {
        this.setState({ [name]: convert(value), errorMessage: null });
      }
    }
  }

  public onChangeIsLocal = (input: React.FormEvent<HTMLInputElement>) => {
    const target = input.currentTarget;
    const value = Boolean(Number(target.value));
    this.setState((previousState) => {
      const rigProject = Object.assign({}, this.state.rigProject, { isLocal: value });
      return { rigProject };
    });
  }

  private canSave = () => {
    // The extension must be named and must have a project folder root.
    if (!this.state.name.trim() || !this.state.rigProject.projectFolderPath.trim()) {
      return false;
    }
    if (this.state.rigProject.isLocal) {
      // At least one extension type must be selected.
      if (!this.state.extensionTypes) {
        return false;
      }
    } else {
      // An online extension must be selected.
      if (!this.state.rigProject.manifest.id) {
        return false;
      }
    }
    return true;
  }

  private getTypes(): string[] {
    const types: string[] = [];
    this.state.extensionTypes & ExtensionTypes.Component && types.push(ExtensionViewType.Component);
    this.state.extensionTypes & ExtensionTypes.Mobile && types.push(ExtensionViewType.Mobile);
    this.state.extensionTypes & ExtensionTypes.Overlay && types.push(ExtensionViewType.Overlay);
    this.state.extensionTypes & ExtensionTypes.Panel && types.push(ExtensionViewType.Panel);
    return types;
  }

  private constructBackendCommand(example: Example) {
    if (this.state.codeGenerationOption === CodeGenerationOption.Template) {
      let backendCommand = example.backendCommand
        .replace('{clientId}', this.state.rigProject.manifest.id)
        .replace('{secret}', this.state.rigProject.secret)
        .replace('{ownerId}', this.props.userId);
      if (this.state.rigProject.isLocal) {
        backendCommand += ' -l';
      }
      return backendCommand;
    }
    return '';
  }

  private saveHandler = async () => {
    if (this.canSave()) {
      try {
        this.setState({ errorMessage: 'Creating your project...' });
        if (this.state.rigProject.isLocal) {
          this.state.rigProject.secret = this.state.rigProject.secret || 'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk';
          const ownerName: string = JSON.parse(localStorage.getItem('rigLogin')).login;
          this.state.rigProject.manifest = generateManifest('https://localhost.rig.twitch.tv:8080', ownerName, this.state.name, this.getTypes());
        }
        const { codeGenerationOption, exampleIndex, examples } = this.state;
        await createProject(this.state.rigProject.projectFolderPath, codeGenerationOption, exampleIndex);
        const example = examples[exampleIndex];
        const rigProject = {
          ...this.state.rigProject,
          frontendFolderName: codeGenerationOption === CodeGenerationOption.Template ? example.frontendFolderName : '',
          backendCommand: this.constructBackendCommand(example),
        };
        this.props.saveHandler(rigProject as RigProject);
      } catch (ex) {
        console.error(ex);
        this.setState({ errorMessage: ex.message });
      }
    }
  }

  private fetchExtensionManifest = async () => {
    const { clientId, version, rigProject: { isLocal, secret } } = this.state;
    try {
      const manifest = await fetchUserExtensionManifest(isLocal, this.props.userId, secret, clientId, version);
      const rigProject = Object.assign({}, this.state.rigProject, { manifest });
      this.setState({
        rigProject,
        name: manifest.name,
      });
    } catch (ex) {
      const rigProject = Object.assign({}, this.state.rigProject, { manifest: ex.message });
      this.setState({ rigProject });
    }
  }

  public render() {
    const saveClassName = 'bottom-bar__save' + (this.canSave() ? '' : ' disabled');
    return (
      <div className="project-dialog">
        <div className="project-dialog__background" />
        <div className="project-dialog__dialog">
          <div className="dialog__top-bar-container">
            <div className="top-bar-container__title">Create New Extension Project</div>
            {!this.props.mustSave && <div className="top-bar-container__escape" onClick={this.props.closeHandler}><img alt="Close" src={closeButton} /></div>}
          </div>
          {this.state.errorMessage && <div>{this.state.errorMessage}</div>}
          <hr className="dialog__divider" />
          <div className="project-dialog__content left">
            <label className="state-value__label">
              <span>Extension Project Name</span>
              <input className="state-value__input" type="text" name="name" value={this.state.name} onChange={this.onChange} />
            </label>
            <div className="project-dialog__state-value">
              <div>Choose Extension</div>
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="isLocal" value={1} checked={this.state.rigProject.isLocal} onChange={this.onChangeIsLocal} />
                <span>Create Local Extension</span>
              </label>
              {this.state.rigProject.isLocal && <div>
                <div>Extension Type</div>
                <label className="state-value__label">
                  <input className="state-value__input" type="checkbox" name="extensionTypes" value={ExtensionTypes.Overlay} checked={Boolean(this.state.extensionTypes & ExtensionTypes.Overlay)} onChange={this.onChange} />
                  <span>Video Overlay</span>
                </label>
                <label className="state-value__label">
                  <input className="state-value__input" type="checkbox" name="extensionTypes" value={ExtensionTypes.Panel} checked={Boolean(this.state.extensionTypes & ExtensionTypes.Panel)} onChange={this.onChange} />
                  <span>Panel</span>
                </label>
                <label className="state-value__label">
                  <input className="state-value__input" type="checkbox" name="extensionTypes" value={ExtensionTypes.Component} checked={Boolean(this.state.extensionTypes & ExtensionTypes.Component)} onChange={this.onChange} />
                  <span>Component</span>
                </label>
                <label className="state-value__label">
                  <input className="state-value__input" type="checkbox" name="extensionTypes" value={ExtensionTypes.Mobile} checked={Boolean(this.state.extensionTypes & ExtensionTypes.Mobile)} onChange={this.onChange} />
                  <span>Mobile</span>
                </label>
              </div>}
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="isLocal" value={0} checked={!this.state.rigProject.isLocal} onChange={this.onChangeIsLocal} />
                <span>Use Already Created Online Extension</span>
              </label>
              {!this.state.rigProject.isLocal && <div>
                <label>
                  <span>Client ID</span>
                  <input type="text" name="clientId" value={this.state.clientId} onChange={this.onChange} />
                </label>
                <label>
                  <span>Secret</span>
                  <input type="text" name="secret" value={this.state.rigProject.secret} onChange={this.onChange} />
                </label>
                <label>
                  <span>Version</span>
                  <input type="text" name="version" value={this.state.version} onChange={this.onChange} />
                </label>
                <button onClick={this.fetchExtensionManifest}>Fetch</button>
                <textarea value={JSON.stringify(this.state.rigProject.manifest)} disabled={true} />
              </div>}
            </div>
            <label className="state-value__label" title="This is the folder we will create to contain your project. You must have already created its parent folder.">
              <span>Project Folder</span>
              <input className="state-value__input" type="text" name="projectFolderPath" value={this.state.rigProject.projectFolderPath} onChange={this.onChange} />
            </label>
            <div className="project-dialog__state-value">
              <div>Add Code to Project</div>
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="codeGenerationOption" value={CodeGenerationOption.None} checked={this.state.codeGenerationOption === CodeGenerationOption.None} onChange={this.onChange} />
                <span>None (Just Create Project Folder)</span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="codeGenerationOption" value={CodeGenerationOption.Scaffolding} checked={this.state.codeGenerationOption === CodeGenerationOption.Scaffolding} onChange={this.onChange} />
                <span>Generate Scaffolding</span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="radio" name="codeGenerationOption" value={CodeGenerationOption.Template} checked={this.state.codeGenerationOption === CodeGenerationOption.Template} onChange={this.onChange} />
                <span>Use Existing Sample Template</span>
              </label>
            </div>
          </div>
          <div className="project-dialog__vertical-bar" />
          {this.state.codeGenerationOption === CodeGenerationOption.Scaffolding ? (
            <div className="project-dialog__content right">
              <div>Tell us more about what your extension will do</div>
              <div>(We’ll automatically provide basic React-based scaffolding, but we want to provide extras where useful!)</div>
              <label className="state-value__label">
                <input className="state-value__input" type="checkbox" name="scaffoldingOptions" value={ScaffoldingOptions.StoreConfiguration} checked={Boolean(this.state.scaffoldingOptions)} onChange={this.onChange} />
                <span>Store Broadcaster Configuration</span>
              </label>
              <label className="state-value__label">
                <input className="state-value__input" type="checkbox" name="scaffoldingOptions" value={ScaffoldingOptions.RetrieveConfiguration} checked={Boolean(this.state.scaffoldingOptions & ScaffoldingOptions.RetrieveConfiguration)} onChange={this.onChange} />
                <span>Retrieve Configuration on Load</span>
              </label>
            </div>
          ) : this.state.codeGenerationOption === CodeGenerationOption.Template ? (
            <div className="project-dialog__content right">
              <div>Start from an existing extension sample from Twitch or the Developer Community</div>
              <div>Twitch Provided Samples</div>
              <select name="exampleIndex" value={this.state.exampleIndex} onChange={this.onChange}>
                {this.state.examples.map((example, index) => (
                  <option key={index} value={index}>{example.title}</option>
                ))}
              </select>
              <div>Community Samples</div>
              <div>Coming soon!  Reach out to developer@twitch.tv if you’d like to contribute.</div>
            </div>
          ) : (
                <div className="project-dialog__content right">
                  <div>You’re all set!  Good luck on your extension!</div>
                </div>
              )}
          <hr className="dialog__divider" />
          <div className="dialog_bottom-bar">
            <div className={saveClassName} onClick={this.saveHandler}>Save</div>
            {!this.props.mustSave && (
              <div className="bottom-bar__cancel" onClick={this.props.closeHandler}>Cancel</div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
