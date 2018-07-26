export interface Configuration {
  EXT_CLIENT_ID: string;
  EXT_VERSION: string;
  EXT_SECRET: string;
  [key: string]: string;
}
export function missingConfigurations(configurations: Configuration): string {
  let msg = 'Missing configurations for rig: ';
  for (let key in configurations) {
    if (!configurations[key]) {
      msg += key + ','
    }
  }
  return msg.slice(0, -1);
}
