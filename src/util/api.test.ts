import { Product } from '../core/models/product';
import {
  fetchExtensionManifest,
  fetchUser,
  fetchProducts,
  fetchNewRelease,
  saveProduct,
} from './api';
import {
  mockFetchError,
  mockFetchForExtensionManifest,
  mockFetchForUserInfo,
  mockFetchProducts,
  mockSaveProduct,
  mockFetchNewRelease,
  mockEmptyResponse,
  mockFetch400,
  mockFetch500,
} from '../tests/mocks';

let globalAny = global as any;
const token = 'token';

describe('api', () => {
  describe('API.fetch', () => {
    it('throws on 400', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetch400);
      expect.assertions(1);
      try {
        await fetchUser(token);
      } catch (ex) {
        expect(ex.message).toEqual(`Cannot authorize to get user data with access token ${token}`);
      }
    });

    it('throws on 500', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetch500);
      expect.assertions(1);
      try {
        await fetchUser(token);
      } catch (ex) {
        expect(ex.message).toEqual('500 error');
      }
    });
  });

  describe('fetchExtensionManifest', () => {
    it('should return data', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchForExtensionManifest);
      const data = await fetchExtensionManifest(true, 'clientId', 'version', 'jwt');
      expect(data).toBeDefined();
    });

    it('throws an exception on invalid response', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      expect.assertions(1);
      try {
        await fetchExtensionManifest(true, 'clientId', 'version', 'jwt');
      } catch (ex) {
        expect(ex.message).toEqual('Unable to retrieve extension manifest; please verify your client ID, secret, and version');
      }
    });
  });

  describe('fetchUser', () => {
    beforeEach(() => {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchForUserInfo);
    });

    it('should return data', async function() {
      const data = await fetchUser(token);
      expect(data).toBeDefined();
    });

    it('on error should fire', async function() {
      expect.assertions(1);

      globalAny.fetch = jest.fn().mockImplementation(mockFetchError);
      try {
        await fetchUser(token);
      } catch (error) {
        expect(error).toEqual('Fake error');
      }
    });

    it('throws an exception on invalid response', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      expect.assertions(1);
      try {
        await fetchUser(token);
      } catch (ex) {
        expect(ex.message).toEqual(`Invalid server response for access token ${token}`);
      }
    });
  });

  describe('fetchProducts', () => {
    it('should serialize products correctly', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchProducts);
      const products = await fetchProducts('clientId', '');
      expect(products).toHaveLength(2);
      products.forEach((product: Product) => {
        expect(product).toMatchObject({
          sku: expect.any(String),
          displayName: expect.any(String),
          amount: expect.stringMatching(/[1-9]\d*/),
          inDevelopment: expect.stringMatching(/true|false/),
          broadcast: expect.stringMatching(/true|false/)
        });
      });
    });

    it('throws an exception on invalid response', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockEmptyResponse);
      expect.assertions(1);
      try {
        await fetchProducts('clientId', token);
      } catch (ex) {
        expect(ex.message).toEqual(`Invalid server response for access token ${token}`);
      }
    });
  });

  describe('saveProduct', () => {
    beforeEach(function() {
      globalAny.fetch = jest.fn().mockImplementation(mockSaveProduct);
    });

    it('succeeds', async function() {
      await saveProduct('clientId', token, {} as Product);
    });
  });

  describe('fetchNewRelease', () => {
    let includeTagName: boolean;

    beforeEach(function() {
      globalAny.fetch = jest.fn().mockImplementation(() => mockFetchNewRelease(includeTagName));
    });

    it('should return data', async function() {
      includeTagName = true;
      const data = await fetchNewRelease();
      expect(data).toBeDefined();
    });

    it('fails without tag name', async function() {
      includeTagName = false;
      fetchNewRelease().catch((error) => {
        expect(error.message).toEqual('Cannot get GitHub developer rig latest release');
      })
    });

    it('throws an exception on failed fetch', async function() {
      globalAny.fetch = jest.fn().mockImplementation(mockFetchError);
      fetchNewRelease().catch((error) => {
        expect(error).toEqual('Fake error');
      });
    });
  });
});
