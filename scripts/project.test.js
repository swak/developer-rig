const { normalize, join } = require('path');
const project = require('./project');
const rmrf = require('./rmrf');

// Configure the project module.
const getRoutes = {};
const postRoutes = {};
const app = {
  use: (_) => { },
  get: (route, fn) => (getRoutes[route] = fn),
  post: (route, fn) => (postRoutes[route] = fn),
};
project(app);
const res = {
  setHeader: (name, value) => {
    console.log(`set header ${name} to ${value}`);
  },
  writeHead: (statusCode) => {
    console.log(`write head ${statusCode}`);
  },
  end: (s) => {
    console.log('end');
    console.log(s);
  },
};

runTests();

async function runTests() {
  // Test the back-end.
  await postRoutes['/backend']({
    body: {
      backendCommand: 'dir\r\nexit /b 3',
      projectFolderPath: 'C:\\Users\\cidzerda\\Documents\\GitHub\\developer-rig',
    },
  }, res);

  // Test the front-end.
  await postRoutes['/frontend']({
    body: {
      frontendFolderPath: '..\\my-extension\\public',
      port: 8080,
      projectFolderPath: 'C:\\Users\\cidzerda\\Documents\\GitHub\\developer-rig',
    },
  }, res);

  // Test project creation.
  const projectFolderPath = normalize(join(__dirname, '..', 'build', 'asdf'));
  const req = {
    body: {
      projectFolderPath,
      codeGenerationOption: 'scaffolding',
      exampleIndex: 0,
    },
  };
  rmrf(projectFolderPath);
  await postRoutes['/project'](req, res);
  rmrf(projectFolderPath);
  req.body.codeGenerationOption = 'none';
  await postRoutes['/project'](req, res);
  await postRoutes['/project'](req, res);
  req.body.codeGenerationOption = 'scaffolding';
  await postRoutes['/project'](req, res);
  rmrf(projectFolderPath);
  req.body.codeGenerationOption = 'template';
  await postRoutes['/project'](req, res);
}
