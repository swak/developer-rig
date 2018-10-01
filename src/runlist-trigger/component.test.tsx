import { RunListTrigger } from './component';
import { setupMountTest } from '../tests/enzyme-util/mount';
import { OnAuthorizedResponse, OnContextResponse } from '../core/models/run-list';

describe('<RunListTrigger />', () => {
  const setupShallow = setupMountTest(RunListTrigger, () => ({
    runList: {
      'onContext': [{
        'name': 'testContext',
      } as OnContextResponse],
      'onAuthorized': [{
        'name': 'testAuth',
      } as OnAuthorizedResponse],
    },
    iframe: {
      contentWindow: {
        postMessage: jest.fn(),
      },
    } as any as HTMLIFrameElement,
  }));

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('changing different triggers sets state correctly', () => {
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RunListTrigger;
    const opts = wrapper.find('option');
    expect(instance.state.selectedTrigger).toEqual('testContext');

    instance.onChange({
      currentTarget: {
        name: 'auth option',
        value: opts.last().text(),
      }
    } as React.FormEvent<HTMLSelectElement>);

    expect(instance.state.selectedTrigger).toEqual('testAuth');
  });

  it('does it', () => {
    const globalAny = global as any;
    globalAny.setTimeout = jest.fn();
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RunListTrigger;
    wrapper.find('.runlist-trigger__button').simulate('click');
    expect(instance.props.iframe.contentWindow.postMessage).toHaveBeenCalled();
  });
});
