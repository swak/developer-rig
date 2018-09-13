import { Product, DeserializedProduct } from '../core/models/product';
import { ExtensionManifest } from '../core/models/manifest';
import { toCamelCase } from '../util/case';

const API_HOST = process.env.API_HOST || 'api.twitch.tv';

const API = {
  async get<T>(path: string, message4xx?: string, headers?: HeadersInit): Promise<T> {
    return API.fetch<T>('GET', path, message4xx, headers);
  },
  async post<T = void>(path: string, body: any, message4xx?: string, headers?: HeadersInit): Promise<T> {
    return API.fetch<T>('POST', path, message4xx, headers, body);
  },
  async fetch<T>(method: 'GET' | 'POST', path: string, message4xx: string, headers: HeadersInit, body?: any): Promise<T> {
    const overridableHeaders: HeadersInit = {
      Accept: 'application/vnd.twitchtv.v5+json; charset=UTF-8',
    };
    if (body) {
      overridableHeaders['Content-Type'] = 'application/json; charset=UTF-8';
    }
    headers = headers ? Object.assign(overridableHeaders, headers) : overridableHeaders;
    const request: RequestInit = {
      method,
      headers,
    };
    if (body) {
      request.body = JSON.stringify(body);
    }
    const url = new URL(path, `https://${API_HOST}`);
    const response = await fetch(url.toString(), request);
    if (response.status >= 400) {
      if (response.status < 500 && message4xx) {
        throw new Error(message4xx);
      } else {
        const message = 'Cannot access Twitch API.  Try again later.';
        throw new Error(await response.json().then((json) => json.message || message).catch(() => message));
      }
    } else if (response.status !== 204) {
      return await response.json() as T;
    }
  }
}

export async function createProject(projectFolderPath: string, codeGenerationOption: string, exampleIndex: number) {
  const url = 'https://localhost.rig.twitch.tv:3000/project';
  return await API.post(url, { projectFolderPath, codeGenerationOption, exampleIndex });
}

export async function startFrontend(frontendFolderPath: string, isLocal: boolean, port: number, projectFolderPath: string) {
  const url = 'https://localhost.rig.twitch.tv:3000/frontend';
  return await API.post(url, { frontendFolderPath, isLocal, port, projectFolderPath });
}

export async function startBackend(backendCommand: string, projectFolderPath: string) {
  const url = 'https://localhost.rig.twitch.tv:3000/backend';
  return await API.post(url, { backendCommand, projectFolderPath });
}

export interface Example {
  title: string;
  description: string;
  repository: string;
  frontendFolderName: string;
  backendCommand: string;
  npm: string[];
}

export async function fetchExamples(): Promise<Example[]> {
  const url = 'https://localhost.rig.twitch.tv:3000/examples';
  return await API.get<Example[]>(url);
}

export async function fetchExtensionManifest(isLocal: boolean, id: string, version: string, jwt: string): Promise<ExtensionManifest> {
  const search = {
    limit: 1,
    searches: [
      { field: 'id', term: id },
      { field: 'version', term: version },
    ],
  };
  const apiDomain = isLocal ? 'localhost.rig.twitch.tv:3000' : 'api.twitch.tv';
  const response = await API.post<{ extensions: any[] }>(`https://${apiDomain}/extensions/search`, search, `Unable to authorize for client id ${id}`, {
    Authorization: `Bearer ${jwt}`,
    'Client-ID': id,
  });
  const { extensions } = response;
  if (extensions && extensions.length) {
    const manifest = toCamelCase(extensions[0]) as ExtensionManifest;
    return manifest;
  }
  throw new Error('Unable to retrieve extension manifest; please verify your client ID, secret, and version');
}

interface UsersResponse {
  data: {
    broadcaster_type: string;
    description: string;
    display_name: string;
    id: string;
    login: string;
    offline_image_url: string;
    profile_image_url: string;
    type: string;
    view_count: number;
  }[];
}

export async function fetchUser(token: string) {
  const url = 'https://api.twitch.tv/helix/users';
  const response = await API.get<UsersResponse>(url, `Cannot authorize to get user data with access token ${token}`, {
    Authorization: `Bearer ${token}`,
  });
  const { data } = response;
  if (data && data.length) {
    return data[0];
  }
  throw new Error(`Invalid server response for access token ${token}`);
}

interface ProductsResponse {
  products: DeserializedProduct[];
}

export async function fetchProducts(clientId: string, token: string): Promise<Product[]> {
  const url = `https://api.twitch.tv/v5/bits/extensions/twitch.ext.${clientId}/products?includeAll=true`;
  const response = await API.get<ProductsResponse>(url, `Cannot authorize to get products for clientId: ${clientId}`, {
    Authorization: `OAuth ${token}`,
    'Client-ID': clientId,
  });
  if (response.products && response.products.length) {
    return response.products.map((p: DeserializedProduct) => ({
      sku: p.sku || '',
      displayName: p.displayName || '',
      amount: p.cost ? Number(p.cost.amount) : 1,
      inDevelopment: p.inDevelopment ? 'true' : 'false',
      broadcast: p.broadcast ? 'true' : 'false',
      deprecated: p.expiration ? Date.parse(p.expiration) <= Date.now() : false,
      dirty: false,
      savedInCatalog: false,
    } as Product));
  }
  throw new Error(`Invalid server response for access token ${token}`);
}

export async function saveProduct(clientId: string, token: string, product: Product) {
  const url = `https://api.twitch.tv/v5/bits/extensions/twitch.ext.${clientId}/products/put`;
  const deserializedProduct = {
    domain: 'twitch.ext.' + clientId,
    sku: product.sku,
    displayName: product.displayName,
    cost: {
      amount: product.amount,
      type: 'bits'
    },
    inDevelopment: product.inDevelopment === 'true',
    broadcast: product.broadcast === 'true',
    expiration: product.deprecated ? new Date(Date.now()).toISOString() : null,
  };
  return API.post(url, { product: deserializedProduct }, 'Cannot authorize to save product', {
    Authorization: `OAuth ${token}`,
    'Client-ID': clientId,
  });
}

export async function fetchNewRelease() {
  const url = 'https://api.github.com/repos/twitchdev/developer-rig/releases/latest';
  const response = await API.get<any>(url, 'Cannot authorize at GitHub', {
    Accept: 'application/vnd.github.v3+json',
  });
  const tagName = response.tag_name;
  const zipUrl = response.assets[0].browser_download_url;
  if (tagName && zipUrl) {
    return {
      tagName,
      zipUrl,
    };
  }
  throw new Error('Cannot get GitHub developer rig latest release');
}
