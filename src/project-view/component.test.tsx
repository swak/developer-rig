import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { ProjectView } from './component';
import { createExtensionManifestForTest } from '../tests/constants/extension';

function mockApiFunctions() {
  const original = require.requireActual('../util/api');
  return {
    ...original,
    fetchHostingStatus: jest.fn().mockImplementation(() => Promise.resolve({})),
  }
}
jest.mock('../util/api', () => mockApiFunctions());
const api = require.requireMock('../util/api');

describe('<ProjectView />', () => {
  const setupShallow = setupShallowTest(ProjectView, () => ({
    rigProject: {
      extensionViews: [],
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
