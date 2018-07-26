import { newMockCoordinator } from './mocks/mock-coordinator';
import { LocalStorage } from './mocks/mock-local-storage';
import { Window } from './mocks/mock-window';

const globalAny: any = global;

export interface Process {
  env: {
    [key: string]: string;
  };
}

export interface Global {
  process: Process;
  localStorage: LocalStorage;
  window: Window;
  fetch: Function;
}

export function mockGlobals() {
  globalAny.process.env.EXT_CLIENT_ID = 'test';
  globalAny.process.env.EXT_SECRET = 'test';
  globalAny.process.env.EXT_VERSION = 'test';
  globalAny.process.env.EXT_USER_NAME = 'test';

  globalAny.localStorage = new LocalStorage();

  globalAny.window.rig = {};
  globalAny.window.rig.history = [];
  globalAny.window.location = {};


  globalAny.window['extension-coordinator'] = newMockCoordinator();
}
