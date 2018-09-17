import * as React from 'react';
import * as classNames from 'classnames';
import * as whitetriangle from '../../img/whitetriangle.svg';
import './component.sass';
import { RigProject } from '../../core/models/rig';

interface State {
  open: boolean;
}

export interface Props {
  currentProjectIndex: number;
  projects: RigProject[];
  createNewProject: () => void;
  selectProject: (projectIndex: number) => void;
}

export class ProjectDropdown extends React.Component<Props, State> {
  state: State = {
    open: false,
  };

  private handleClick = () => {
    this.setState({ open: !this.state.open });
  }

  public render() {
    const dropdownClass = classNames({
      'project__menu': true,
      'transition': true,
      'open': this.state.open,
    });

    const triangleClass = classNames({
      'project__triangle': true,
      'open': this.state.open,
    });

    return (
      <div className='project__dropdown' onClick={this.handleClick}>
        <div className='project__header'>Select an Extension Project <img className={triangleClass} src={whitetriangle} alt='open or close' /></div>
        <div className={dropdownClass}>
          <ul>
            <li key={-1}>
              <div onClick={this.props.createNewProject}>Create New Project</div>
            </li>
            {this.props.projects.map((project, index) => (
              <li key={index}>
                <div title={project.manifest.description} onClick={() => this.props.selectProject(index)}>{project.manifest.name}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}
