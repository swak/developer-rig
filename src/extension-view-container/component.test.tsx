import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { createExtensionForTest, createViewsForTest } from '../tests/constants/extension';
import { ExtensionViewContainer } from './component';
import { ExtensionAnchors } from '../constants/extension-types';
import { ViewerTypes } from '../constants/viewer-types';
import { ExtensionMode, ExtensionAnchor } from '../constants/extension-coordinator';

const setupShallow = setupShallowTest(ExtensionViewContainer, () => ({
  mode: ExtensionMode.Viewer,
  extensionViews: createViewsForTest(0, '', ''),
  deleteExtensionViewHandler: jest.fn(),
  openExtensionViewHandler: jest.fn(),
  openEditViewHandler: jest.fn(),
  extension: createExtensionForTest(),
  isLocal: true,
}));

describe('<ExtensionViewContainer />', () => {
  it('openExtensionViewHandler is called when the create button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('ExtensionViewButton').simulate('click');
    expect(wrapper.instance().props.openExtensionViewHandler).toHaveBeenCalled();
  });

  describe('when in viewer mode', () => {
    it('renders correctly', () => {
      const { wrapper } = setupShallow();
      expect(wrapper).toMatchSnapshot();
    });
    it('has the correct number of views', () => {
      const { wrapper } = setupShallow({
        extensionViews: createViewsForTest(2, ExtensionAnchors[ExtensionAnchor.Panel], ViewerTypes.LoggedOut)
      });
      expect(wrapper.find('Connect(ExtensionViewComponent)')).toHaveLength(2);
    });
    it('renders no views if none specified', () => {
      const { wrapper } = setupShallow();
      expect(wrapper.find('Connect(ExtensionViewComponent)')).toHaveLength(0);
    });
  });
});
