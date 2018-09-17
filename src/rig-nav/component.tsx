import * as React from 'react';
import * as classNames from 'classnames';
import './component.sass';
import { NavItem } from '../constants/nav-items';
import { UserDropdown } from '../user-dropdown';
import { LoginButton } from '../login-button';
import { UserSession } from '../core/models/user-session';
import { ExtensionManifest } from '../core/models/manifest';
import { ProjectDropdown, Props as ProjectDropdownProps } from './project-dropdown';

export interface PublicProps {
  manifest: ExtensionManifest,
  viewerHandler: Function,
  selectedView: NavItem,
  error: string,
}

export interface ReduxStateProps {
  session?: UserSession,
  mockApiEnabled?: boolean,
}

type Props = PublicProps & ProjectDropdownProps & ReduxStateProps;

export class RigNavComponent extends React.Component<Props> {
  private openProductManagementHandler = (): void => {
    const { session, manifest, viewerHandler } = this.props;
    if ((session && session.login) && (manifest && manifest.bitsEnabled)) {
      viewerHandler(NavItem.ProductManagement);
    }
  }

  public render() {
    const { session, manifest, selectedView } = this.props;
    const projectOverviewClass = classNames({
      'offset': true,
      'top-nav-item': true,
      'top-nav-item__selected': selectedView === NavItem.ProjectOverview,
    });
    const extensionViewsClass = classNames({
      'offset': true,
      'top-nav-item': true,
      'top-nav-item__selected': selectedView === NavItem.ExtensionViews,
    });
    const productManagementClass = classNames({
      'top-nav-item': true,
      'top-nav-item__selected': selectedView === NavItem.ProductManagement,
      'top-nav-item__disabled': !(session && session.login) || !(manifest && manifest.bitsEnabled),
    });

    if (this.props.error) {
      return (
        <div className='top-nav-error'>
          <a> {this.props.error} </a>
        </div>
      );
    } else {
      return (
        <div className='top-nav'>
          <div className='personal-bar'>
            <ProjectDropdown
              currentProjectIndex={this.props.currentProjectIndex}
              projects={this.props.projects}
              createNewProject={this.props.createNewProject}
              selectProject={this.props.selectProject}
            />
            {manifest && <div className='personal-bar__ext-name'>
              <span>{manifest.name}</span>
            </div>}
            {session && session.login && <div className='top-nav-item__login'>
              <UserDropdown session={session} />
            </div>}
          </div>
          <div className='top-nav__item-container'>
            <a className={projectOverviewClass} onClick={() => this.props.viewerHandler(NavItem.ProjectOverview)}>
              Project Overview
            </a>
            <a className={extensionViewsClass} onClick={() => this.props.viewerHandler(NavItem.ExtensionViews)}>
              Extension Views
            </a>
            <a className={productManagementClass} onClick={(event) => this.openProductManagementHandler()}>
              Manage Bits Products
            </a>
          </div>
        </div>
      );
    }
  }
}
