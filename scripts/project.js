module.exports = function(app) {
  const childProcess = require('child_process');
  const fs = require('fs');
  const parseCommandString = require('minimist-string');
  const { isAbsolute, join } = require('path');
  const children = {
    backend: null,
    frontend: null,
  };

  app.use(require('body-parser').json());

  const examples = [
    {
      title: 'Hello World',
      description: 'Click a button to change the color on a circle.',
      repository: 'twitchdev/extensions-hello-world',
      frontendFolderName: join('extensions-hello-world', 'public'),
      backendCommand: process.platform === 'win32' ? 'node extensions-hello-world\\services\\backend -c "{clientId}" -s "{secret}" -o "{ownerId}"' :
        'node extensions-hello-world/services/backend -c "{clientId}" -s "{secret}" -o "{ownerId}"',
      npm: ['i'],
      sslFolderName: 'conf',
    },
    {
      title: 'Something Else',
      description: "Don't select this.",
      repository: 'twitchdev/extensions-something-else',
    },
  ];

  app.get('/examples', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(examples));
  });

  app.post('/backend', async (req, res) => {
    const { backendCommand, projectFolderPath } = req.body;
    try {
      const parsedArgs = parseCommandString(backendCommand);
      const args = [];
      Object.keys(parsedArgs).forEach((key) => {
        if (key === '_') {
          args.push(...parsedArgs._.filter((_, index) => index));
        } else {
          const hyphen = key.length === 1 ? '-' : '--';
          args.push(hyphen + key);
          if (parsedArgs[key] !== true) {
            args.push(parsedArgs[key]);
          }
        }
      });
      const options = {};
      if (projectFolderPath) {
        options.cwd = projectFolderPath;
      }
      const child = childProcess.spawn(parsedArgs._[0], args, options);
      await new Promise((resolve, reject) => {
        let hasResolved = false;
        child.stderr.on('data', (data) => process.stderr.write(data.toString()));
        child.stdout.on('data', (data) => process.stdout.write(data.toString()));
        child.on('error', (ex) => reject(ex));
        child.on('exit', (code) => {
          hasResolved = hasResolved || (clearTimeout(timerId), resolve(), code, true);
        });
        const timerId = setTimeout(() => {
          hasResolved = hasResolved || (resolve(), true);
        }, 999);
      });
      if (child.error || child.status) {
        throw child.error || new Error(child.stderr.toString());
      } else if (child.exitCode) {
        throw new Error(`Back-end command exited with exit code ${child.exitCode}`);
      }
      children.backend = child;
      res.writeHead(204);
      res.end();
    } catch (ex) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      res.end(JSON.stringify({ name: ex.name, message: ex.message }));
    }
  });

  app.post('/frontend', async (req, res) => {
    const { frontendFolderPath, isLocal, port, projectFolderPath } = req.body;
    try {
      const options = {};
      const args = [
        join('scripts', 'host.js'),
        '-d',
        isAbsolute(frontendFolderPath) ? frontendFolderPath : join(projectFolderPath, frontendFolderPath),
        '-p',
        port,
      ];
      if (isLocal) {
        args.push('-l');
      }
      const child = childProcess.spawn('node', args, options);
      await new Promise((resolve, reject) => {
        let hasResolved = false;
        child.stderr.on('data', (data) => process.stderr.write(data.toString()));
        child.stdout.on('data', (data) => process.stdout.write(data.toString()));
        child.on('error', (ex) => reject(ex));
        child.on('exit', (code) => {
          hasResolved = hasResolved || (clearTimeout(timerId), resolve(), code, true);
        });
        const timerId = setTimeout(() => {
          hasResolved = hasResolved || (resolve(), true);
        }, 999);
      });
      if (child.error || child.status) {
        throw child.error || new Error(child.stderr.toString());
      } else if (child.exitCode) {
        throw new Error(`Back-end command exited with exit code ${child.exitCode}`);
      }
      children.frontend = child;
      res.writeHead(204);
      res.end();
    } catch (ex) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      res.end(JSON.stringify({ name: ex.name, message: ex.message }));
    }
  });

  app.post('/project', async (req, res) => {
    const { projectFolderPath, codeGenerationOption, exampleIndex } = req.body;
    let deleteOnError = false;
    try {
      if (isAbsolute(projectFolderPath)) {
        if (!fs.existsSync(projectFolderPath)) {
          fs.mkdirSync(projectFolderPath);
        } else if (codeGenerationOption !== 'none' && fs.readdirSync(projectFolderPath).length) {
          throw new Error(`Invalid project folder "${projectFolderPath}"; it must be empty`);
        }
        deleteOnError = true;
      } else {
        throw new Error(`Invalid project folder "${projectFolderPath}"; it must be an absolute path`);
      }
      if (codeGenerationOption === 'template') {
        const { repository, npm, sslFolderName } = examples[exampleIndex];
        if (repository) {
          const exampleFolderPath = await fetchExample(repository, projectFolderPath);
          // If necessary, run npm.
          if (npm) {
            const { error, status } = childProcess.spawnSync('npm', npm, {
              cwd: exampleFolderPath,
              shell: true,
            });
            if (error || status) {
              throw new Error('npm failure');
            }
          }

          // If necessary, copy SSL certificates.
          if (sslFolderName) {
            const sslFolderPath = join(exampleFolderPath, sslFolderName);
            if (!fs.existsSync(sslFolderPath)) {
              fs.mkdirSync(sslFolderPath);
            }
            ['crt', 'key'].forEach((ext) => fs.copyFileSync(join('ssl', `server.${ext}`), join(sslFolderPath, `server.${ext}`)));
          }
        } else {
          console.warn('TODO:  handle non-GitHub examples.');
        }
      } else if (codeGenerationOption === 'scaffolding') {
        // TODO:  handle scaffolding.
      }
      res.writeHead(204);
      res.end();
    } catch (ex) {
      if (deleteOnError) {
        require('./rmrf')(projectFolderPath);
      }
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      res.end(JSON.stringify({ name: ex.name, message: ex.message }));
      console.error(ex);
    }
  });

  app.get('/status', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    const status = {
      isBackendRunning: !!children.backend,
      isFrontendRunning: !!children.frontend,
    };
    res.end(JSON.stringify(status));
  });

  const StopOptions = {
    Backend: 1,
    Frontend: 2,
  };

  app.post('/stop', async (req, res) => {
    const { stopOptions } = req.body;
    const backendResult = stopOptions & StopOptions.Backend ? await stop(children.backend) : '';
    const frontendResult = stopOptions & StopOptions.Frontend ? await stop(children.frontend) : '';
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    const status = {
      backendResult,
      frontendResult,
    };
    res.end(JSON.stringify(status));

    async function stop(child) {
      if (child) {
        child.kill();
        return await new Promise((resolve, _) => {
          let hasResolved = false;
          child.stderr.on('data', (data) => process.stderr.write(data.toString()));
          child.stdout.on('data', (data) => process.stdout.write(data.toString()));
          child.on('error', (ex) => {
            hasResolved = hasResolved || (resolve(ex.message), true);
          });
          child.on('exit', (_) => {
            hasResolved = hasResolved || (resolve('exited'), true);
            if (child === children.backend) {
              children.backend = null;
            } else {
              children.frontend = null;
            }
          });
        });
      }
      return 'not running';
    }
  });

  function fetchExample(repository, projectFolderPath) {
    // Determine if git is available.
    const exampleFolderName = repository.split('/')[1];
    const exampleFolderPath = join(projectFolderPath, exampleFolderName);
    const versionResult = childProcess.spawnSync('git', ['--version']);
    if (!versionResult.error && !versionResult.status) {
      // Try to clone it using git.
      const cloneUrl = `https://github.com/${repository}.git`;
      const cloneResult = childProcess.spawnSync('git', ['clone', '--', cloneUrl, exampleFolderPath]);
      if (!cloneResult.status) {
        // Successfully cloned the repository.
        return Promise.resolve(exampleFolderPath);
      } else {
        // Failed to clone the repository.
        return Promise.reject(new Error(cloneResult.stderr.toString()));
      }
    } else {
      // Try to fetch the Zip file and unzip it.
      return new Promise((resolve, reject) => {
        const handleError = (ex) => {
          // Failed to fetch or unzip the Zip file.
          reject(ex);
          reject = (ex) => { };
        };
        const zipUrl = `https://github.com/${repository}/archive/master.zip`;
        const zip = '.master.zip';
        const zipRequest = require('request')(zipUrl);
        const writeStream = fs.createWriteStream(zip);
        const zipPipe = zipRequest.pipe(writeStream);
        [zipRequest, writeStream, zipPipe].forEach((value) => value.on('error', handleError));
        zipPipe.on('close', () => {
          const readStream = fs.createReadStream(zip);
          const extractor = require('unzip').Extract({ path: projectFolderPath });
          const unzipPipe = readStream.pipe(extractor);
          [readStream, extractor, unzipPipe].forEach((value) => value.on('error', handleError));
          unzipPipe.on('close', () => {
            // Successfully fetched and unzipped the Zip file.
            try {
              fs.unlinkSync(zip);
              fs.renameSync(`${exampleFolderName}-master`, exampleFolderName);
              resolve(exampleFolderPath);
            } catch (ex) {
              handleError(ex);
            }
          });
        });
      });
    }
  }
};
