import * as React from 'react';
import './component.sass';
import { RigNav } from '../rig-nav';
import { ExtensionViewContainer } from '../extension-view-container';
import { Console } from '../console';
import { ExtensionViewDialog, ExtensionViewDialogState } from '../extension-view-dialog';
import { EditViewDialog, EditViewProps } from '../edit-view-dialog';
import { ProductManagementViewContainer } from '../product-management-container';
import { createExtensionObject, fetchUserExtensionManifest } from '../util/extension';
import { fetchUser, stopHosting } from '../util/api';
import { NavItem } from '../constants/nav-items'
import { OverlaySizes } from '../constants/overlay-sizes';
import { IdentityOptions } from '../constants/identity-options';
import { MobileSizes } from '../constants/mobile';
import { RigExtensionView, RigProject } from '../core/models/rig';
import { ExtensionManifest } from '../core/models/manifest';
import { UserSession } from '../core/models/user-session';
import { SignInDialog } from '../sign-in-dialog';
import { ExtensionMode, ExtensionViewType } from '../constants/extension-coordinator';
import { ProjectView } from '../project-view';
import { CreateProjectDialog } from '../create-project-dialog';

enum LocalStorageKeys {
  RigLogin = 'rigLogin',
}

export interface ReduxStateProps {
  session: UserSession;
}

export interface ReduxDispatchProps {
  saveManifest: (manifest: ExtensionManifest) => void;
  userLogin: (userSession: UserSession) => void;
}

interface State {
  projects: RigProject[],
  currentProject?: RigProject,
  manifest: ExtensionManifest;
  showingExtensionsView: boolean;
  showingEditView: boolean;
  showingCreateProjectDialog: boolean;
  idToEdit: string;
  selectedView: NavItem;
  userId?: string;
  error?: string;
}

type Props = ReduxDispatchProps & ReduxStateProps;

export class RigComponent extends React.Component<Props, State> {
  public state: State = {
    projects: [],
    manifest: {} as ExtensionManifest,
    showingExtensionsView: false,
    showingEditView: false,
    showingCreateProjectDialog: false,
    idToEdit: '0',
    selectedView: NavItem.ProjectOverview,
  }

  get currentProjectIndex() { return this.state.projects.indexOf(this.state.currentProject); }

  constructor(props: Props) {
    super(props);
    this.setLogin();
    this.loadProjects();
  }

  public openEditViewHandler = (id: string) => {
    this.setState({
      showingEditView: true,
      idToEdit: id,
    });
  }

  public closeEditViewHandler = () => {
    this.setState({
      showingEditView: false,
      idToEdit: '0',
    });
  }

  public viewerHandler = (selectedView: NavItem) => {
    this.setState({ selectedView });
  }

  public openExtensionViewHandler = () => {
    if (!this.state.error) {
      this.setState({
        showingExtensionsView: true,
      });
    }
  }

  public closeExtensionViewDialog = () => {
    this.setState({
      showingExtensionsView: false
    });
  }

  public getFrameSizeFromDialog(extensionViewDialogState: ExtensionViewDialogState) {
    if (extensionViewDialogState.frameSize === 'Custom') {
      return {
        width: extensionViewDialogState.width,
        height: extensionViewDialogState.height
      };
    }
    if (extensionViewDialogState.extensionViewType === ExtensionViewType.Mobile) {
      return MobileSizes[extensionViewDialogState.frameSize];
    }

    return OverlaySizes[extensionViewDialogState.frameSize];
  }

  public createExtensionView = (extensionViewDialogState: ExtensionViewDialogState) => {
    const extensionViews = this.state.currentProject.extensionViews || [];
    const mode = extensionViewDialogState.extensionViewType === ExtensionMode.Config ? ExtensionMode.Config :
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard ? ExtensionMode.Dashboard : ExtensionMode.Viewer;
    const linked = extensionViewDialogState.identityOption === IdentityOptions.Linked ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Config ||
      extensionViewDialogState.extensionViewType === ExtensionMode.Dashboard;
    const nextExtensionViewId = 1 + extensionViews.reduce((reduced: number, view: RigExtensionView) => {
      return Math.max(reduced, parseInt(view.id, 10));
    }, 0);
    extensionViews.push({
      id: nextExtensionViewId.toString(),
      channelId: extensionViewDialogState.channelId,
      type: extensionViewDialogState.extensionViewType,
      features: {
        isChatEnabled: extensionViewDialogState.isChatEnabled,
      },
      extension: createExtensionObject(
        this.state.currentProject.manifest,
        nextExtensionViewId.toString(),
        extensionViewDialogState.viewerType,
        linked ? extensionViewDialogState.linkedUserId : '',
        extensionViewDialogState.channelId,
        this.state.currentProject.secret,
        extensionViewDialogState.opaqueId,
      ),
      linked,
      mode,
      isPopout: extensionViewDialogState.isPopout,
      role: extensionViewDialogState.viewerType,
      x: extensionViewDialogState.x,
      y: extensionViewDialogState.y,
      orientation: extensionViewDialogState.orientation,
      frameSize: this.getFrameSizeFromDialog(extensionViewDialogState),
    });
    this.updateExtensionViews(extensionViews);
    this.closeExtensionViewDialog();
  }

  public deleteExtensionView = (id: string) => {
    this.updateExtensionViews(this.state.currentProject.extensionViews.filter(element => element.id !== id));
  }

  public editViewHandler = (newViewState: EditViewProps) => {
    const views = this.state.currentProject.extensionViews;
    views.forEach((element: RigExtensionView) => {
      if (element.id === this.state.idToEdit) {
        element.x = newViewState.x;
        element.y = newViewState.y;
        element.orientation = newViewState.orientation;
      }
    });
    this.updateExtensionViews(views);
    this.closeEditViewHandler();
  }

  public createProject = async (project: RigProject) => {
    this.state.currentProject && await this.stopHosting();
    this.setState((previousState) => {
      const previousProjects = previousState.currentProject ? previousState.projects : [];
      localStorage.setItem('currentProjectIndex', previousProjects.length.toString());
      const projects = [...previousProjects, project];
      localStorage.setItem('projects', JSON.stringify(projects));
      const selectedView = project.backendCommand || project.frontendFolderName ?
        NavItem.ProjectOverview : NavItem.ExtensionViews;
      return { currentProject: project, projects, selectedView, showingCreateProjectDialog: false };
    });
  }

  public updateProject = (project: RigProject) => {
    this.setState((previousState) => {
      const currentProject = Object.assign(previousState.currentProject, project);
      const projects = previousState.projects;
      localStorage.setItem('projects', JSON.stringify(projects));
      return { currentProject, projects };
    });
  }

  public showCreateProjectDialog = () => {
    this.setState({ showingCreateProjectDialog: true });
  }

  public selectProject = async (projectIndex: number) => {
    const selectedProject = this.state.projects[projectIndex];
    if (selectedProject !== this.state.currentProject) {
      await this.stopHosting();
      this.setState({ currentProject: selectedProject });
      localStorage.setItem('currentProjectIndex', this.currentProjectIndex.toString());
    }
  }

  private async stopHosting() {
    const result = await stopHosting();
    result.backendResult && console.error('backend', result.backendResult);
    result.frontendResult && console.error('frontend', result.frontendResult);
  }

  public closeProjectDialog = () => {
    this.setState({ showingCreateProjectDialog: false });
  }

  public render() {
    const currentProject = this.state.currentProject;
    return (
      <div className="rig-container">
        <RigNav
          currentProjectIndex={this.currentProjectIndex}
          projects={this.state.projects}
          createNewProject={this.showCreateProjectDialog}
          selectProject={this.selectProject}
          manifest={currentProject ? currentProject.manifest : null}
          selectedView={this.state.selectedView}
          viewerHandler={this.viewerHandler}
          error={this.state.error} />
        {this.state.error ? (
          <label>Something went wrong: {this.state.error}</label>
        ) : !this.props.session ? (
          <SignInDialog />
        ) : !currentProject || this.state.showingCreateProjectDialog ? (
          <CreateProjectDialog
            userId={this.state.userId}
            mustSave={!this.state.currentProject}
            closeHandler={this.closeProjectDialog}
            saveHandler={this.createProject}
          />
        ) : this.state.selectedView === NavItem.ProductManagement ? (
          <ProductManagementViewContainer clientId={currentProject.manifest.id} />
        ) : this.state.selectedView === NavItem.ProjectOverview ? (
          <div>
            <ProjectView
              key={this.currentProjectIndex}
              rigProject={currentProject}
              onChange={this.updateProject}
            />
          </div>
        ) : (
          <div>
            <ExtensionViewContainer
              deleteExtensionViewHandler={this.deleteExtensionView}
              extensionViews={this.state.currentProject.extensionViews}
              isLocal={this.state.currentProject.isLocal}
              openEditViewHandler={this.openEditViewHandler}
              openExtensionViewHandler={this.openExtensionViewHandler}
            />
            {this.state.showingExtensionsView && (
              <ExtensionViewDialog
                channelId="999999999"
                extensionViews={currentProject.manifest.views}
                closeHandler={this.closeExtensionViewDialog}
                saveHandler={this.createExtensionView}
              />
            )}
            {this.state.showingEditView && (
              <EditViewDialog
                idToEdit={this.state.idToEdit}
                views={this.state.currentProject.extensionViews}
                closeHandler={this.closeEditViewHandler}
                saveViewHandler={this.editViewHandler}
              />
            )}
            <Console />
          </div>
        )}
      </div>
    );
  }

  public updateExtensionViews(extensionViews: RigExtensionView[]) {
    this.updateProject({ extensionViews } as RigProject);
  }

  private async loadProjects() {
    const projectsValue = localStorage.getItem('projects');
    if (projectsValue) {
      const projects = JSON.parse(projectsValue) as RigProject[];
      const currentProject = projects[Number(localStorage.getItem('currentProjectIndex') || 0)];
      const selectedView = currentProject.backendCommand || currentProject.frontendFolderName ?
        NavItem.ProjectOverview : NavItem.ExtensionViews;
      Object.assign(this.state, { currentProject, projects, selectedView });
    } else if (process.env.EXT_CLIENT_ID && process.env.EXT_SECRET && process.env.EXT_VERSION) {
      const serializedExtensionViews = localStorage.getItem('extensionViews');
      const currentProject: RigProject = {
        extensionViews: serializedExtensionViews ? JSON.parse(serializedExtensionViews) : [],
        isLocal: process.env.EXT_SECRET.startsWith('kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk'),
        projectFolderPath: '',
        manifest: { id: process.env.EXT_CLIENT_ID, version: process.env.EXT_VERSION } as ExtensionManifest,
        secret: process.env.EXT_SECRET,
        frontendFolderName: '',
        backendCommand: '',
      };
      const projects = [currentProject];
      Object.assign(this.state, { currentProject, projects });
      localStorage.setItem('projects', JSON.stringify(projects));
      localStorage.setItem('currentProjectIndex', '0');
      const { isLocal, secret, manifest: { id: clientId, version } } = currentProject;
      try {
        const manifest = await fetchUserExtensionManifest(isLocal, this.state.userId, secret, clientId, version);
        this.setState((previousState) => {
          Object.assign(previousState.currentProject, { manifest });
          localStorage.setItem('projects', JSON.stringify([previousState.currentProject]));
          return previousState;
        });
      } catch (ex) {
        console.error(ex.message);
      }
    }
  }

  private async setLogin() {
    const windowHash = window.location.hash;
    if (windowHash.includes('access_token')) {
      const accessTokenKey = 'access_token=';
      const accessTokenIndex = windowHash.indexOf(accessTokenKey);
      const ampersandIndex = windowHash.indexOf('&');
      const accessToken = windowHash.substring(accessTokenIndex + accessTokenKey.length, ampersandIndex);

      try {
        const response = await fetchUser(accessToken);
        const userSession = {
          authToken: accessToken,
          displayName: response.display_name,
          id: response.id,
          login: response.login,
          profileImageUrl: response.profile_image_url,
        };

        this.props.userLogin(userSession);
        localStorage.setItem(LocalStorageKeys.RigLogin, JSON.stringify(userSession));
        window.location.assign('/');
      } catch (error) {
        this.setState({ error });
      }
    } else {
      const rigLogin = localStorage.getItem(LocalStorageKeys.RigLogin);
      if (rigLogin) {
        try {
          const userSession = JSON.parse(rigLogin) as UserSession;
          if (userSession && userSession.authToken && userSession.id && userSession.login && userSession.profileImageUrl) {
            this.props.userLogin(userSession);
            this.state.userId = userSession.id;
          } else {
            localStorage.removeItem(LocalStorageKeys.RigLogin);
          }
        } catch (ex) {
          localStorage.removeItem(LocalStorageKeys.RigLogin);
        }
      }
    }
  }
}
