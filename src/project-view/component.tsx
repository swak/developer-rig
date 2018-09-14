import * as React from 'react';
import './component.sass';
import { RigProject } from '../core/models/rig';
import { startBackend, startFrontend } from '../util/api';

export interface ProjectViewProps {
  rigProject: RigProject,
  onChange: (rigProject: RigProject) => void,
}

interface State {
  backendResult: string;
  frontendResult: string;
}

export class ProjectView extends React.Component<ProjectViewProps, State>{
  public state: State = {
    backendResult: '',
    frontendResult: '',
  };

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

  private startBackend = async () => {
    if (this.props.rigProject.backendCommand) {
      try {
        await startBackend(this.props.rigProject.backendCommand, this.props.rigProject.projectFolderPath);
        this.setState({ backendResult: 'started' });
      } catch (ex) {
        this.setState({ backendResult: ex.message });
      }
    }
  }

  private startFrontend = async () => {
    const rigProject = this.props.rigProject;
    if (rigProject.frontendFolderName) {
      try {
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
        await startFrontend(rigProject.frontendFolderName, rigProject.isLocal, frontendPort, rigProject.projectFolderPath);
        this.setState({ frontendResult: 'started' });
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

  public render() {
    const rigProject = this.props.rigProject;
    const manifest = rigProject.manifest;
    return (
      <div className="project-view">
        <div>
          <label>
            <div>Project Name</div>
            <input className="half" type="text" name="name" value={manifest.name} onChange={this.onChange} />
          </label>
          <label title="This is the path to your front-end files relative to the Project Folder.  If there is no Project Folder, ensure this path is absolute.">
            <div>Front-end Files Location</div>
            <input type="text" name="frontendFolderName" value={rigProject.frontendFolderName} onChange={this.onChange} />
            <button title="" onClick={this.startFrontend}>Host with Rig</button>
            <span>{this.state.frontendResult}</span>
          </label>
          <label title="This is the command used to run your back-end.  If there is a Project Folder, this command is run with that folder as its current directory.">
            <div>Back-end Run Command</div>
            <input type="text" name="backendCommand" value={rigProject.backendCommand} onChange={this.onChange} />
            <button title="" onClick={this.startBackend}>Activate</button>
            <span>{this.state.backendResult}</span>
          </label>
          <label>
            <div>Project Folder</div>
            <input type="text" name="projectFolderPath" value={rigProject.projectFolderPath} onChange={this.onChange} />
          </label>
          <label>
            <div>Extension Types</div>
            <div>{this.getExtensionViews(rigProject)}</div>
          </label>
        </div>
        <div className="vertical-bar" />
        <div>
          <div>How to Run an Extension in the Rig</div>
          <ol>
            <li>
              <div>Host your front-end files.</div>
              <div>You can host your front-end files with the Rig by entering the path to your HTML files in the "Front-end Files Location" text box and clicking the "Host with Rig" button.</div>
            </li>
            <li>
              <div>If your extension has a back-end, run it locally.</div>
              <div>You can run your back-end service from the Rig by entering the command to activate it in the "Back-end Run Command" text box and clicking the "Activate" button.</div>
            </li>
            <li>
              <div>Go to Extension Views and add the Extension Types that match your extension.</div>
            </li>
          </ol>
          <button>View Tutorial</button>
          <button>Go to Documentation</button>
        </div>
      </div>
    );
  }
}
