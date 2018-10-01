import * as React from 'react';
import './component.sass';
import { RigProject } from '../core/models/rig';
import { fetchHostingStatus, startBackend, hostFrontend, startFrontend, stopHosting, StopOptions } from '../util/api';
import { fetchUserExtensionManifest } from '../util/extension';

export interface ProjectViewProps {
  rigProject: RigProject,
  userId: string;
  onChange: (rigProject: RigProject) => void,
}

enum HostingResult {
  None = '',
  NotRunning = 'not running',
  Started = 'started',
  Running = 'running',
  Exited = 'exited',
}

interface State {
  backendResult: string;
  frontendResult: string;
}

export class ProjectView extends React.Component<ProjectViewProps, State>{
  public state: State = {
    backendResult: HostingResult.None,
    frontendResult: HostingResult.None,
  };

  constructor(props: ProjectViewProps) {
    super(props);
    fetchHostingStatus().then((status) => {
      const { rigProject } = props;
      this.setState({
        backendResult: getStatus(rigProject.backendCommand, status.isBackendRunning),
        frontendResult: getStatus(rigProject.frontendFolderName || rigProject.frontendCommand, status.isFrontendRunning),
      });

      function getStatus(value: string, isRunning: boolean): HostingResult {
        return value ? isRunning ? HostingResult.Running : HostingResult.NotRunning : HostingResult.None;
      }
    });
  }

  public onChange = (input: React.FormEvent<HTMLInputElement>) => {
    const { name, value } = input.currentTarget;
    if (name === 'name') {
      if (this.props.rigProject.isLocal) {
        const manifest = Object.assign({}, this.props.rigProject.manifest, { name: value });
        this.props.onChange({ manifest } as any as RigProject);
      }
    } else {
      this.props.onChange({ [name]: value } as any as RigProject);
    }
  }

  private toggleBackend = async () => {
    const rigProject = this.props.rigProject;
    if (rigProject.backendCommand) {
      try {
        this.setState({ backendResult: HostingResult.None });
        if (this.getIsRunning(this.state.backendResult)) {
          const { backendResult } = await stopHosting(StopOptions.Backend);
          this.setState({ backendResult });
        } else {
          await startBackend(rigProject.backendCommand, rigProject.projectFolderPath);
          this.setState({ backendResult: HostingResult.Running });
        }
      } catch (ex) {
        this.setState({ backendResult: ex.message });
      }
    }
  }

  private toggleFrontend = async () => {
    const rigProject = this.props.rigProject;
    if (rigProject.frontendFolderName || rigProject.frontendCommand) {
      try {
        const frontendState = this.state.frontendResult;
        this.setState({ frontendResult: HostingResult.None });
        if (this.getIsRunning(frontendState)) {
          const { frontendResult } = await stopHosting(StopOptions.Frontend);
          this.setState({ frontendResult });
        } else if (rigProject.frontendCommand) {
          await startFrontend(rigProject.frontendFolderName, rigProject.frontendCommand, rigProject.projectFolderPath);
          this.setState({ frontendResult: HostingResult.Started });
        } else {
          let frontendPort: number;
          ['panel', 'component', 'videoOverlay', 'mobile', 'config', 'liveConfig'].some((name) => {
            const view = (rigProject.manifest.views as any)[name];
            if (view && view.viewerUrl) {
              const url = new URL(view.viewerUrl);
              frontendPort = parseInt(url.port, 10) || (url.protocol === 'http:' ? 80 : 443);
              return true;
            }
            return false;
          });
          if (!frontendPort) {
            throw new Error('Cannot determine front-end port from extension');
          }
          await hostFrontend(rigProject.frontendFolderName, rigProject.isLocal, frontendPort, rigProject.projectFolderPath);
          this.setState({ frontendResult: HostingResult.Started });
        }
      } catch (ex) {
        this.setState({ frontendResult: ex.message });
      }
    }
  }

  private getExtensionViews(rigProject: RigProject): string {
    if (rigProject.manifest.views) {
      const extensionViewTypes = ['panel', 'component', 'videoOverlay', 'mobile'];
      return ['Panel', 'Component', 'Video Overlay', 'Mobile'].filter((_, index) => {
        return Object.getOwnPropertyDescriptor(rigProject.manifest.views, extensionViewTypes[index]);
      }).join(', ');
    }
    return '';
  }

  private viewDocumentation() {
    window.open('https://dev.twitch.tv/docs/extensions/', 'developer-rig-help');
  }

  private viewTutorial() {
    window.open('https://www.twitch.tv/videos/239080621', 'developer-rig-help');
  }

  private getIsRunning(result: string) {
    return result === HostingResult.Started || result === HostingResult.Running;
  }

  private refreshManifest = async () => {
    const { secret, manifest: { id: clientId, version } } = this.props.rigProject;
    const manifest = await fetchUserExtensionManifest(false, this.props.userId, secret, clientId, version);
    this.props.onChange({ manifest } as any as RigProject);
  }

  public render() {
    const rigProject = this.props.rigProject;
    const frontendHostText = this.getIsRunning(this.state.frontendResult) ? 'Stop Hosting' : 'Host with Rig';
    const frontendCommandText = this.getIsRunning(this.state.frontendResult) ? 'Deactivate' : 'Activate';
    const backendText = this.getIsRunning(this.state.backendResult) ? 'Deactivate' : 'Activate';
    return (
      <div className="project-view">
        <div className="project-view__section project-view__section--left">
          <label className="project-view-property">
            <div className="project-view-property__name">Project Name</div>
            <input className="project-view-property__input project-view-property__input--half" type="text" name="name" value={rigProject.manifest.name} onChange={this.onChange} />
          </label>
          <label className="project-view-property" title="This is the path to your front-end files relative to the Project Folder.  If there is no Project Folder, ensure this path is absolute.">
            <div className="project-view-property__name">Front-end Files Location</div>
            <input className="project-view-property__input" type="text" name="frontendFolderName" value={rigProject.frontendFolderName} onChange={this.onChange} />
            {!rigProject.frontendCommand && (
              <>
                <button className="project-view__button" title="" onClick={this.toggleFrontend}>{frontendHostText}</button>
                <div title="This is the result of the front-end hosting command." className="project-view-property__result">{this.state.frontendResult}</div>
              </>
            )}
          </label>
          <label className="project-view-property" title="This is the command used to host your front-end files.  If you leave this blank, you may use the Developer Rig to host your front-end files.">
            <div className="project-view-property__name">Front-end Host Command</div>
            <input className="project-view-property__input" type="text" name="frontendCommand" value={rigProject.frontendCommand} onChange={this.onChange} placeholder="Leave blank for Developer Rig hosting" />
            {rigProject.frontendCommand && (
              <>
                <button className="project-view__button" title="" onClick={this.toggleFrontend}>{frontendCommandText}</button>
                <div title="This is the result of the front-end activation command." className="project-view-property__result">{this.state.frontendResult}</div>
              </>
            )}
          </label>
          <label className="project-view-property" title="This is the command used to run your back-end.  If there is a Project Folder, this command is run with that folder as its current directory.">
            <div className="project-view-property__name">Back-end Run Command</div>
            <input className="project-view-property__input" type="text" name="backendCommand" value={rigProject.backendCommand} onChange={this.onChange} />
            <button className="project-view__button" title="" onClick={this.toggleBackend}>{backendText}</button>
            <div title="This is the result of the back-end activation command." className="project-view-property__result">{this.state.backendResult}</div>
          </label>
          <label className="project-view-property">
            <div className="project-view-property__name">Project Folder</div>
            <input className="project-view-property__input" type="text" name="projectFolderPath" value={rigProject.projectFolderPath} onChange={this.onChange} />
          </label>
          <label className="project-view-property">
            <div className="project-view-property__name">Extension Types</div>
            <div className="project-view-property__value">{this.getExtensionViews(rigProject)}</div>
          </label>
          {!rigProject.isLocal && (
            <>
              <label className="project-view-property">
                <button className="project-view__button project-view__button--first" onClick={this.refreshManifest}>Refresh Manifest</button>
              </label>
              <label className="project-view-property">
                Make sure your Asset Paths are correct. Your "Testing Base URI" must
                be https://localhost.rig.twitch.tv:8080/ to use the Developer Rig.
                Also, ensure the individual Extension Type paths are correct.
                Click <a href={`https://dev.twitch.tv/projects/${rigProject.manifest.id}/files`} target="dev-site">here</a> then
                click "Manage" for version {rigProject.manifest.version} then
                click "Asset Hosting" to check and adjust if needed.
              </label>
            </>
          )}
        </div>
        <div className="project-view__vertical-bar" />
        <div className="project-view__section project-view__section--right">
          <div className="project-view__title">How to Run an Extension in the Rig</div>
          <ol>
            <li className="project-view__item">
              <div className="project-view__item-text project-view__item-text--title">Host your front-end files.</div>
              <div className="project-view__item-text">You can host your front-end files with the Rig by entering the path to
                your HTML files in the "Front-end Files Location" text box and clicking the "Host with Rig" button.  If your
                front-end requires a custom command, such as for a React application, enter its activation command in the
                "Front-end Host Command" text box and click the "Activate" button.</div>
            </li>
            <li className="project-view__item">
              <div className="project-view__item-text project-view__item-text--title">If your extension has a back-end, run it locally.</div>
              <div className="project-view__item-text">You can run your back-end service from the Rig by entering the command
                to activate it in the "Back-end Run Command" text box and clicking the "Activate" button.</div>
            </li>
            <li className="project-view__item">
              <div className="project-view__item-text project-view__item-text--title">Go to Extension Views and add the
                Extension Types that match your extension.</div>
            </li>
          </ol>
          <button className="project-view__button project-view__button--first" onClick={this.viewTutorial}>View Tutorial</button>
          <button className="project-view__button" onClick={this.viewDocumentation}>Go to Documentation</button>
        </div>
      </div>
    );
  }
}
