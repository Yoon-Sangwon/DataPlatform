import {IncomingMessage, ServerResponse} from 'http';
import {RequestHandler} from 'http-proxy-middleware';
import {NextFunction} from 'http-proxy-middleware/dist/types';

export interface MatchOptions {
    host: string;
    path: string;
    req: IncomingMessage;
}

export interface ProxyRoute<TReq = IncomingMessage, TRes = ServerResponse, TNext = NextFunction> {
    match: (options: MatchOptions) => boolean;
    middleware: RequestHandler<TReq, TRes, TNext>;
}
