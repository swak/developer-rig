import { setupShallowTest } from '../tests/enzyme-util/shallow';
import { CreateProjectDialog } from './component';
import { generateManifest } from '../util/generate-manifest';

Math.random = () => .25;
const login = 'test';
localStorage.setItem('rigLogin', JSON.stringify({ login }));

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
    expect(wrapper.find('.project-dialog__dialog').first().text().trim()).toBe('Create New Extension ProjectExtension Project NameChoose ExtensionCreate Local ExtensionUse Already Created Online ExtensionExtension TypesVideo OverlayPanelComponentMobileProject FolderAdd Code to ProjectNone (Just Create Project Folder)Generate ScaffoldingUse Existing Sample TemplateYou’re all set!  Good luck on your extension!SaveCancel');
  });

  it('fires closeHandler when top exit button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.project-dialog__escape').simulate('click');
    expect(wrapper.instance().props.closeHandler).toHaveBeenCalled();
  });

  it('fires closeHandler when cancel button is clicked', () => {
    const { wrapper } = setupShallow();
    wrapper.find('.bottom-bar__cancel').simulate('click');
    expect(wrapper.instance().props.closeHandler).toHaveBeenCalled();
  });

  it('fires saveHandler when save button is clicked', () => {
    const value = 'value';
    const { wrapper } = setupShallowTest(CreateProjectDialog, () => ({
      userId: 'userId',
      closeHandler: jest.fn(),
      saveHandler: jest.fn().mockImplementation(() => {
        expect(wrapper.instance().props.saveHandler).toHaveBeenCalledWith({
          backendCommand: '',
          frontendFolderName: '',
          isLocal: true,
          manifest: generateManifest('https://localhost.rig.twitch.tv:8080', login, value, ['panel']),
          projectFolderPath: value,
          secret: 'test',
        });
      }),
    }))();
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
