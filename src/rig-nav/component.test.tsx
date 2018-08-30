import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { RigNavComponent } from '.';
import { NavItem } from '../constants/nav-items';
import { LoginButton } from '../login-button';
import { UserDropdown } from '../user-dropdown';
import { createExtensionManifestForTest } from '../tests/constants/extension';

const defaultGenerator = () => ({
  openConfigurationsHandler: jest.fn(),
  viewerHandler: jest.fn(),
  configHandler: jest.fn(),
  liveConfigHandler: jest.fn(),
  openProductManagementHandler: jest.fn(),
  selectedView: NavItem.ExtensionViews,
  error: '',
  manifest: createExtensionManifestForTest(),
  session: { displayName: 'test', login: 'test', id: 'test', profileImageUrl: 'test.png', authToken: 'test' },
  mockApiEnabled: false,
});

const setupShallow = setupShallowTest(RigNavComponent, defaultGenerator);

describe('<RigNavComponent />', () => {
  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('renders an error', () => {
    const { wrapper } = setupShallow({
      error: 'test error',
    });

    expect(wrapper.find('.top-nav-error').text().trim()).toBe('test error');
  });

  it('correctly handles clicks on each tab', () => {
    const { wrapper } = setupShallow();
    wrapper.find('a.top-nav-item').forEach((tab: any) => {
      tab.simulate('click');
    });
    expect(wrapper.instance().props.viewerHandler).toHaveBeenCalledTimes(3);
  });

  it('correct css classes are set when things are selected', () => {
    const { wrapper } = setupShallow({
      selectedView: NavItem.ExtensionViews,
    });
    expect(wrapper.find('.top-nav-item__selected')).toHaveLength(1);

    wrapper.setProps({
      selectedView: NavItem.ProductManagement,
    });
    wrapper.update();
    expect(wrapper.find('.top-nav-item__selected')).toHaveLength(1);
  });

  it('renders login button if no session', () => {
    const { wrapper } = setupShallow({
      session: undefined,
    });
    expect(wrapper.find(LoginButton));
  });

  it('renders user dropdown if session exists', () => {
    const { wrapper } = setupShallow();
    expect(wrapper.find(UserDropdown));
  });

  it('disables product management tab when user is not logged in', () => {
    const { wrapper } = setupShallow({
      session: undefined,
    });
    expect(wrapper.find('.top-nav-item__disabled')).toHaveLength(1);
  });

  it('disables product management tab when extension is not bits enabled', () => {
    const { wrapper } = setupShallow({
      manifest: {
        ...createExtensionManifestForTest(),
        bitsEnabled: false,
      },
    });
    expect(wrapper.find('.top-nav-item__disabled')).toHaveLength(1);
  });
});
