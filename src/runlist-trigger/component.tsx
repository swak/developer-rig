import * as React from 'react';
import { RunList, GenericResponse } from '../core/models/run-list';
import './component.sass';

const ExtensionOnContext = 'twitch-ext-context';
const ExtensionOnAuthorized = 'twitch-ext-auth';

export interface PublicProps {
  runList: RunList;
  iframe?: HTMLIFrameElement;
}

interface State {
  hasTriggered: boolean;
  selectedTrigger: string;
  runListTriggerMap: {
    [key: string]: GenericResponse;
  };
  triggerTypeMap: {
    [key: string]: string;
  }
}

type Props = PublicProps;

export class RunListTrigger extends React.Component<Props, State>{
  constructor(props: Props) {
    super(props);

    this.state = {
      ...this.stateFromRunList(this.props.runList),
    }
  }

  public onChange(event: React.FormEvent<HTMLSelectElement>) {
    this.setState({
      selectedTrigger: event.currentTarget.value,
      hasTriggered: false,
    });
  }

  private stateFromRunList(runList: RunList): State {
    let firstTrigger;
    let runlistMap: { [key: string]: GenericResponse } = {}
    let triggerMap: { [key: string]: string } = {}
    for (let callback in runList) {
      for (let resp of runList[callback]) {
        if (!firstTrigger) {
          firstTrigger = resp.name;
        }
        runlistMap[resp.name] = resp;
        triggerMap[resp.name] = callback;
      }
    }

    return {
      hasTriggered: false,
      selectedTrigger: firstTrigger,
      runListTriggerMap: runlistMap,
      triggerTypeMap: triggerMap,
    }
  }

  private dataFromTrigger(trigger: string) {
    let data = undefined;

    const response = Object.assign({}, this.state.runListTriggerMap[trigger]);
    delete response.name;

    switch (this.state.triggerTypeMap[trigger]) {
      case 'onContext':
        data = {
          action: ExtensionOnContext,
          context: response,
        }
        break;
      case 'onAuthorized':
        data = {
          action: ExtensionOnAuthorized,
          auth: response,
        }
        break;
    }
    return data;
  }

  private triggerRunlistResponse(iframe?: HTMLIFrameElement) {
    const data = this.dataFromTrigger(this.state.selectedTrigger);
    if (data && iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(data, '*');
      this.setState({ hasTriggered: true });
    }
  }

  private renderRunListOptions(runList: RunList): JSX.Element[] {
    let opts = [];
    for (let callback in runList) {
      for (let resp of runList[callback]) {
        opts.push(
          <option key={resp.name}>
            {resp.name}
          </option>
        )
      }
    }
    return opts;
  }

  public render() {
    const textClassName = 'runlist-trigger__text' +
      (this.state.hasTriggered ? ' runlist-trigger__text--on' : '');
    return (
      <div className='runlist-trigger'>
        <div className={textClassName}>[Response Recieved]</div>
        <select className='runlist-trigger__select' onChange={(e) => this.onChange(e)}>
          {this.renderRunListOptions(this.props.runList)}
        </select>
        <button className='runlist-trigger__button' onClick={() => this.triggerRunlistResponse(this.props.iframe)}>Trigger</button>
      </div>
    );
  }
}
