import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ProjectView } from './component';
import { createExtensionManifestForTest } from '../tests/constants/extension';

describe('<ProjectView />', () => {
  const setupShallow = setupShallowTest(ProjectView, () => ({
    rigProject: {
      isLocal: true,
      projectFolderPath: 'test',
      manifest: createExtensionManifestForTest(),
      secret: 'test',
      frontendFolderName: 'test',
      backendCommand: 'test',
    },
    onChange: () => { },
  }));

  describe('config mode views', () => {
    it('renders correctly', () => {
      const { wrapper } = setupShallow();
      expect(wrapper).toMatchSnapshot();
    });
  });
});
