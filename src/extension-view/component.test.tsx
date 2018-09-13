import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ExtensionViewComponent } from './component';
import { ViewerTypes } from '../constants/viewer-types';
import { createExtensionForTest } from '../tests/constants/extension';
import { MobileOrientation } from '../constants/mobile';
import { ExtensionAnchor, ExtensionMode, ExtensionViewType, ExtensionPlatform } from '../constants/extension-coordinator';

const DeleteButtonSelector = '.view__close_button.visible';

describe('<ExtensionViewComponent />', () => {
  const setupShallow = setupShallowTest(ExtensionViewComponent, () => ({
    channelId: 'twitch',
    id: '0',
    extension: createExtensionForTest(),
    type: ExtensionAnchor.Panel,
    role: ViewerTypes.Broadcaster,
    mode: 'viewer',
    linked: false,
    isLocal: true,
    isPopout: false,
    position: { x: 0, y: 0 },
    frameSize: { width: 0, height: 0 },
    deleteViewHandler: jest.fn(),
    openEditViewHandler: jest.fn(),
    iframe: '',
    mockApiEnabled: false,
    installationAbilities: {
      isChatEnabled: true,
    }
  }));

  it('when moused over displays the delete button', () => {
    const { wrapper } = setupShallow();
    wrapper.simulate('mouseEnter');
    expect(wrapper.state().mousedOver).toBe(true);
    expect(wrapper.find(DeleteButtonSelector)).toHaveLength(1);
  });

  it('when moused over and mouse leaves, no delete button displayed', () => {
    const { wrapper } = setupShallow();
    wrapper.simulate('mouseEnter');
    expect(wrapper.state().mousedOver).toBe(true);
    expect(wrapper.find(DeleteButtonSelector)).toHaveLength(1);
    wrapper.simulate('mouseLeave');
    expect(wrapper.state().mousedOver).toBe(false);
    expect(wrapper.find(DeleteButtonSelector)).toHaveLength(0);
  });

  it('when moused over and delete button is clicked, the deleteViewHandler is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.simulate('mouseEnter');
    expect(wrapper.state().mousedOver).toBe(true);
    expect(wrapper.find(DeleteButtonSelector)).toHaveLength(1);
    wrapper.find(DeleteButtonSelector).simulate('click');
    expect(wrapper.instance().props.deleteViewHandler).toHaveBeenCalled();
  });

  describe('config mode views', () => {
    it('renders correctly when in config mode', () => {
      const { wrapper } = setupShallow({
        type: ExtensionMode.Config
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('live config mode views', () => {
    it('renders correctly when in config mode', () => {
      const { wrapper } = setupShallow({
        type: ExtensionMode.Dashboard
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('mobile mode views', () => {
    it('renders correctly when in mobile mode', () => {
      const { wrapper } = setupShallow({
        type: ExtensionPlatform.Mobile,
        orientation: MobileOrientation.Portrait,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('component mode views', () => {
    it('renders component view when in component mode', () => {
      const { wrapper } = setupShallow({
        type: ExtensionAnchor.Component,
      });
      expect(wrapper).toMatchSnapshot();
      expect(wrapper.find('ExtensionComponentView').length).toBe(1);
    });

    it('brings up the edit dialog when edit is clicked', () => {
      const { wrapper } = setupShallow({
        type: ExtensionAnchor.Component,
      });

      wrapper.simulate('mouseEnter');
      expect(wrapper.state().mousedOver).toBe(true);
      wrapper.find('.view__edit_button').simulate('click');
      expect(wrapper.instance().props.openEditViewHandler).toHaveBeenCalled();
    });
  });

  describe('panel mode views', () => {
    it('renders correctly when in panel mode as a Broadcaster', () => {
      const { wrapper } = setupShallow();
      expect(wrapper).toMatchSnapshot();
    });

    it('sets correct panel height when panel height provided', () => {
      const extensionWithPanelHeight: ExtensionCoordinator.ExtensionObject = {
        ...createExtensionForTest(),
        views: {
          config: {
            canLinkExternalContent: false,
            viewerUrl: "test",
          },
          liveConfig: {
            canLinkExternalContent: false,
            viewerUrl: "test",
          },
          panel: {
            canLinkExternalContent: false,
            viewerUrl: 'test',
            height: 300,
          }
        },
      };

      const { wrapper } = setupShallow({
        extension: extensionWithPanelHeight
      });

      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in panel mode as a Logged In and Unlinked Viewer', () => {
      const { wrapper } = setupShallow({
        role: ViewerTypes.LoggedIn,
        linked: false,
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in panel mode as a Logged In and Linked Viewer', () => {
      const { wrapper } = setupShallow({
        role: ViewerTypes.LoggedIn,
        linked: true,
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in panel mode as a Logged Out', () => {
      const { wrapper } = setupShallow({
        role: ViewerTypes.LoggedOut,
      });
      expect(wrapper).toMatchSnapshot();
    });
  });

  describe('overlay mode views', () => {
    it('renders correctly in overlay mode as a Broadcaster', () => {
      const { wrapper } = setupShallow({
        type: ExtensionAnchor.Overlay,
        frameSize: {
          height: 1,
          width: 1
        }
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in overlay mode as a Logged In and Unlinked Viewer', () => {
      const { wrapper } = setupShallow({
        role: ViewerTypes.LoggedIn,
        linked: false,
        frameSize: {
          height: 1,
          width: 1
        }
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in overlay mode as a Logged In and Linked Viewer', () => {
      const { wrapper } = setupShallow({
        role: ViewerTypes.LoggedIn,
        linked: true,
        frameSize: {
          height: 1,
          width: 1
        }
      });
      expect(wrapper).toMatchSnapshot();
    });

    it('renders correctly when in overlay mode as a Logged Out', () => {
      const { wrapper } = setupShallow({
        role: ViewerTypes.LoggedOut,
        frameSize: {
          height: 1,
          width: 1
        }
      });
      expect(wrapper).toMatchSnapshot();
    });
  });
});
