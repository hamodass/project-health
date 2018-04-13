import * as express from 'express';

import {UserRecord} from '../../models/userModel';

import * as responseHelper from './response-helper';

export interface CookiesObject {
  [key: string]: {
    value: string,
    options: {},
  };
}

export interface ErrorAPIResponse {
  statusCode: number;
  error: {code: string; message: string;};
}

export interface DataAPIResponse {
  statusCode: number;
  cookies?: CookiesObject;
  // tslint:disable-next-line:no-any
  data: any;
}

export type APIResponse = ErrorAPIResponse|DataAPIResponse;

export type PublicAPICallback = (request: express.Request) =>
    Promise<APIResponse>;

export type PrivateAPICallback =
    (request: express.Request, userRecord: UserRecord) => Promise<APIResponse>;

export type APIRouteCallback = PublicAPICallback|PrivateAPICallback;

interface APIRouteOpts {
  requireBody?: boolean;
}

export abstract class AbstractAPIRouter<T extends APIRouteCallback> {
  protected expRouter: express.Router;

  constructor() {
    this.expRouter = express.Router();
  }

  get(apiPath: string, callback: T) {
    this.expRouter.get(apiPath, this.wrapCallback(callback, {}));
  }

  post(apiPath: string, callback: T, opts: APIRouteOpts = {}) {
    this.expRouter.post(apiPath, this.wrapCallback(callback, opts));
  }

  private wrapCallback(callback: T, opts: APIRouteOpts) {
    return async (request: express.Request, response: express.Response) => {
      try {
        // Some other middleware may have responded to the request.
        if (response.headersSent) {
          return;
        }

        // If the api requires a body, we can quickly response.
        if (opts.requireBody && !request.body) {
          responseHelper.error(
              'no-body', 'You must provide a request body for this API.');
          return;
        }

        const apiResponse =
            await this.executeCallback(callback, request, response);

        if ('error' in apiResponse) {
          response.status(apiResponse.statusCode).json(apiResponse.error);
        } else {
          // Set any cookies if they are defined.
          if (apiResponse.cookies) {
            Object.keys(apiResponse.cookies).forEach((key) => {
              if (!apiResponse.cookies) {
                return;
              }

              const cookieDetails = apiResponse.cookies[key];
              response.cookie(key, cookieDetails.value, cookieDetails.options);
            });
          }

          response.status(apiResponse.statusCode).json(apiResponse.data);
        }

      } catch (err) {
        response.status(500).json({
          error: {
            code: 'uncaught-exception',
            message: 'An uncaught exception was thrown: ' + err.message,
          },
        });
      }
    };
  }

  get router() {
    return this.expRouter;
  }

  protected abstract executeCallback(
      callback: T,
      request: express.Request,
      response: express.Response): Promise<APIResponse>;
}