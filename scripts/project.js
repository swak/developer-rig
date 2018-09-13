module.exports = function(app) {
  const childProcess = require('child_process');
  const fs = require('fs');
  const { isAbsolute, join } = require('path');

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
      if (process.platform === 'win32') {
        const commandFilePath = join(process.env.TEMP, `rbe${Math.floor(99999 * Math.random())}.cmd`);
        const fout = fs.createWriteStream(commandFilePath);
        try {
          fout.write(backendCommand);
          fout.end();
          await new Promise((resolve, reject) => {
            fout.on('error', (ex) => reject(ex));
            fout.on('close', () => resolve());
          });
          const options = {};
          if (projectFolderPath) {
            options.cwd = projectFolderPath;
          }
          const child = childProcess.spawn('cmd.exe', ['/c', commandFilePath], options);
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
          fs.unlinkSync(commandFilePath);
        } catch (ex) {
          fs.unlinkSync(commandFilePath);
          throw ex;
        }
      } else {
        // TODO:  handle Mac.
      }
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
      if (process.platform === 'win32') {
        const commandFilePath = join(process.env.TEMP, `rfe${Math.floor(99999 * Math.random())}.cmd`);
        const fout = fs.createWriteStream(commandFilePath);
        try {
          fout.write(`yarn host -d "${join(projectFolderPath, frontendFolderPath)}" -p ${port}${isLocal ? ' -l' : ''}`);
          fout.end();
          await new Promise((resolve, reject) => {
            fout.on('error', (ex) => reject(ex));
            fout.on('close', () => resolve());
          });
          const options = {};
          const child = childProcess.spawn('cmd.exe', ['/c', commandFilePath], options);
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
          fs.unlinkSync(commandFilePath);
        } catch (ex) {
          fs.unlinkSync(commandFilePath);
          throw ex;
        }
      } else {
        // TODO:  handle Mac.
      }
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
        fs.mkdirSync(projectFolderPath);
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
