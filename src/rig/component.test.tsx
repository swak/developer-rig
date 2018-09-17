import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { createViewsForTest, createExtensionForTest, createExtensionManifestForTest } from '../tests/constants/extension';
import { mockFetchForUserInfo } from '../tests/mocks';
import { NavItem } from '../constants/nav-items';
import { RigComponent } from './component';
import { ExtensionAnchors } from '../constants/extension-types';
import { ViewerTypes } from '../constants/viewer-types';
import { RigExtensionView, RigProject } from '../core/models/rig';
import { ExtensionViewDialogState } from '../extension-view-dialog';
import { ExtensionAnchor, ExtensionViewType } from '../constants/extension-coordinator';

let globalAny = global as any;

localStorage.setItem('projects', '[{}]');

const setupShallow = setupShallowTest(RigComponent, () => ({
  session: { displayName: 'test', login: 'test', id: 'test', profileImageUrl: 'test.png', authToken: 'test' },
  saveManifest: jest.fn(),
  userLogin: jest.fn()
}));

describe('<RigComponent />', () => {
  function setUpProjectForTest(type: ExtensionAnchor) {
    const extensionViews = createViewsForTest(1, ExtensionAnchors[type], ViewerTypes.LoggedOut);
    localStorage.setItem('projects', JSON.stringify([{extensionViews}]));
  };

  function setupComponentViewsForTest(numViews: number) {
    const testViews = createViewsForTest(numViews, ExtensionAnchors[ExtensionAnchor.Component], ViewerTypes.LoggedOut);
    localStorage.setItem('extensionViews', JSON.stringify(testViews));
  };

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('renders extension view correctly', () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
    expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(1);
  });

  it('gets extension views from local storage correctly', () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    expect(instance.state.currentProject.extensionViews).toEqual(testViews);
  });

  it('deletes extension view correctly', () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(1);

    instance.deleteExtensionView('1');
    wrapper.update();
    expect((wrapper.find('ExtensionViewContainer') as any).props().extensionViews).toHaveLength(0);
  });

  it('toggles state when edit dialog is opened/closed', () => {
    setUpProjectForTest(ExtensionAnchor.Component);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    instance.openEditViewHandler('1');
    expect(instance.state.showingEditView).toBe(true);
    expect(instance.state.idToEdit).toBe('1');

    instance.closeEditViewHandler();
    expect(instance.state.showingEditView).toBe(false);
    expect(instance.state.idToEdit).toBe('0');
  });

  it('edit changes the view and sets them correctly', () => {
    setUpProjectForTest(ExtensionAnchor.Component);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    instance.openEditViewHandler('1');
    expect(instance.state.showingEditView).toBe(true);
    expect(instance.state.idToEdit).toBe('1');

    instance.editViewHandler({ x: 25, y: 25 });

    const views = instance.state.currentProject.extensionViews;
    const editedView = views.filter((element: RigExtensionView) => element.id === '1');
    expect(editedView[0].x).toEqual(25);
    expect(editedView[0].y).toEqual(25);
    expect(instance.state.showingEditView).toBe(false);
    expect(instance.state.idToEdit).toBe('0');
  });

  it('correctly toggles state when create extension view is opened/closed', () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;
    instance.state.manifest = createExtensionManifestForTest();
    instance.state.currentProject = { manifest: instance.state.manifest } as RigProject;

    instance.openExtensionViewHandler();
    expect(instance.state.showingExtensionsView).toBe(true);

    instance.closeExtensionViewDialog();
    expect(instance.state.showingExtensionsView).toBe(false);
  });

  it('correctly sets state when viewHandler is invoked', () => {
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    wrapper.setState({ manifest: createExtensionManifestForTest() });

    const instance = wrapper.instance() as RigComponent;
    instance.viewerHandler(NavItem.ExtensionViews);
    expect(instance.state.selectedView).toBe(NavItem.ExtensionViews);
  });

  it('gets the correct views when getExtensionViews invoked', () => {
    const testViews = createViewsForTest(1, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut);
    setUpProjectForTest(ExtensionAnchor.Panel);
    const { wrapper } = setupShallow();
    const instance = wrapper.instance() as RigComponent;

    expect(instance.state.currentProject.extensionViews).toEqual(testViews);
  });

  describe('gets frame size from dialog ref correctly', () => {
    it('returns correct data for mobile ', () => {
      const { wrapper } = setupShallow();
      const testDialogState = {
        width: 0,
        height: 0,
        frameSize: 'iPhone X (375x822)',
        extensionViewType: ExtensionViewType.Mobile
      } as ExtensionViewDialogState;
      const expectedMobileFrameSize = {
        width: 375,
        height: 822,
      };
      const instance = wrapper.instance() as RigComponent;

      let frameSize = instance.getFrameSizeFromDialog(testDialogState);
      expect(frameSize).toEqual(expectedMobileFrameSize);
    });

    it('returns correct data for other types', () => {
      const { wrapper } = setupShallow();
      const overlayTestDialogState = {
        width: 0,
        height: 0,
        frameSize: '640x480',
        extensionViewType: ExtensionViewType.Overlay
      } as ExtensionViewDialogState;
      const expectedOverlayFrameSize = {
        width: 640,
        height: 480,
      };
      const instance = wrapper.instance() as RigComponent;
      const frameSize = instance.getFrameSizeFromDialog(overlayTestDialogState);
      expect(frameSize).toEqual(expectedOverlayFrameSize);
    });

    it('returns correct data for custom size', () => {
      const { wrapper } = setupShallow();
      const overlayTestDialogState = {
        width: 100,
        height: 100,
        frameSize: 'Custom',
        extensionViewType: ExtensionViewType.Overlay
      } as ExtensionViewDialogState;
      const expectedOverlayFrameSize = {
        width: 100,
        height: 100,
      };
      const instance = wrapper.instance() as RigComponent;
      const frameSize = instance.getFrameSizeFromDialog(overlayTestDialogState);
      expect(frameSize).toEqual(expectedOverlayFrameSize);
    });

    it('correctly fetches user info if login not in localStorage', () => {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchForUserInfo);
      globalAny.window.location.hash = 'access_token=test&';

      setupShallow();
      expect(globalAny.fetch).toHaveBeenCalled();
    });
  });
});
