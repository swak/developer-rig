import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { CreateProjectDialog } from './component';

const mockExamples = [{
  title: 'title',
  description: 'description',
  repository: 'repository-owner/repository-name',
  frontendFolderName: 'frontendFolderName',
  backendCommand: 'backendCommand',
  npm: ['npm'],
}];

function mockApiFunctions() {
  const original = require.requireActual('../util/api');
  return {
    ...original,
    createProject: jest.fn().mockImplementation(() => Promise.resolve()),
    fetchExamples: jest.fn().mockImplementation(() => Promise.resolve(mockExamples)),
  }
}
jest.mock('../util/api', () => mockApiFunctions());
const api = require.requireMock('../util/api');

describe('<CreateProjectDialog />', () => {
  const setupShallow = setupShallowTest(CreateProjectDialog, () => ({
    userId: 'userId',
    closeHandler: jest.fn(),
    saveHandler: jest.fn()
  }));

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });

  it('expects label-only content', () => {
    const { wrapper } = setupShallow();
    expect(wrapper.find('.project-dialog__content').first().text().trim()).toBe('Extension Project NameChoose ExtensionCreate Local ExtensionExtension TypeVideo OverlayPanelComponentMobileUse Already Created Online ExtensionProject FolderAdd Code to ProjectNone (Just Create Project Folder)Generate ScaffoldingUse Existing Sample Template');
  });

  it('fires closeHandler when top exit button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.top-bar-container__escape').simulate('click');
    expect(wrapper.instance().props.closeHandler).toHaveBeenCalled();
  });

  it('fires closeHandler when cancel button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.bottom-bar__cancel').simulate('click');
    expect(wrapper.instance().props.closeHandler).toHaveBeenCalled();
  });

  it('fires saveHandler when save button is clicked', () => {
    const { wrapper } = setupShallowTest(CreateProjectDialog, () => ({
      userId: 'userId',
      closeHandler: jest.fn(),
      saveHandler: jest.fn().mockImplementation(() => {
        expect(wrapper.instance().props.saveHandler).toHaveBeenCalledWith({
          isLocal: true,
          projectFolderPath: value,
          manifest: {},
          secret: 'test',
          frontendFolderName: mockExamples[0].frontendFolderName,
          backendCommand: mockExamples[0].backendCommand,
        });
      }),
    }))();
    const value = 'value';
    ['name', 'projectFolderPath'].forEach((name: string) => {
      wrapper.find('input[name="' + name + '"]').simulate('change', { currentTarget: { name, value } });
    })
    wrapper.find('.bottom-bar__save').simulate('click');
  });

  it('does not invoke saveHandler when save button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.bottom-bar__save').simulate('click');
    expect(wrapper.instance().props.saveHandler).not.toHaveBeenCalled();
  });
});
