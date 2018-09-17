import { setupShallowTest } from '../../tests/enzyme-util/shallow';
import { ProjectDropdown } from './component';

describe('<ProjectDropdown />', () => {
  const setupShallow = setupShallowTest(ProjectDropdown, () => ({
    projects: [],
  }));

  it('renders correctly', () => {
    const { wrapper } = setupShallow();
    expect(wrapper).toMatchSnapshot();
  });
});
