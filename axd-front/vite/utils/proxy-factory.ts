import {IncomingMessage, ServerResponse} from 'http';
import {createProxyMiddleware} from 'http-proxy-middleware';
import type {MatchOptions, ProxyRoute} from './types';
import {rewriteJSONBody} from './proxy-response-transformer';

export function createRewriteEnvironmentsAPIOnProxyResFunc() {
    const environmentsAPIPaths = ['/nrs/environments', '/environments'];

    return (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => {
        const isEnvironmentsAPI = req.method === 'GET' && environmentsAPIPaths.some(environmentsAPIPath => req.url?.includes(environmentsAPIPath));

        if (isEnvironmentsAPI) {
            rewriteJSONBody(proxyRes, req, res, json => {
                if (json?.contents) {
                    if (json.contents['auth.server.url']) {
                        json.contents['auth.server.url'] = 'http://auth.csr.kr-local-jainwon.com:12083';
                    }
                    if (json.contents['api-gw.hrp.host']) {
                        json.contents['api-gw.hrp.host'] = 'http://api-agw-backend.hrp.kr-local-jainwon.com:12083';
                    }
                }
                return json;
            });
        }
    };
}

function createAPIGatewayContext(serviceName: string) {
    return ({host, path}: MatchOptions) => {
        if (host.includes('api-agw-backend.hrp.kr-local-jainwon.com')) {
            return path.startsWith(`/${serviceName}`);
        }
        return false;
    };
}

export function createAPIGatewayLocalProxy(serviceName: string, port: number, rewriteEnvironments?: boolean): ProxyRoute {
    return {
        match: createAPIGatewayContext(serviceName),
        middleware: createProxyMiddleware({
            target: `http://127.0.0.1:${port}`,
            changeOrigin: true,
            pathRewrite: {[`^/${serviceName}`]: ''},
            on: {
                proxyRes: (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => {
                    if (proxyRes.headers['access-control-allow-origin']) {
                        proxyRes.headers['access-control-allow-origin'] = req.headers.origin;
                    }
                },
                ...(rewriteEnvironments ? {proxyRes: createRewriteEnvironmentsAPIOnProxyResFunc()} : {}),
            },
        }),
    };
}

function createAPIGatewayEnvironmentsContext() {
    const environmentsAPIPath = '/nrs/environments';

    return ({host, path, req}: MatchOptions) => {
        if (host.includes('api-agw-backend.hrp.kr-local-jainwon.com')) {
            return (req.method === 'GET' || req.method === 'OPTIONS') && path.startsWith(environmentsAPIPath);
        }
        return false;
    };
}

export function createAPIGatewayEnvironmentsProxy(port: number, rewriteEnvironments?: boolean): ProxyRoute {
    return {
        match: createAPIGatewayEnvironmentsContext(),
        middleware: createProxyMiddleware({
            target: `http://127.0.0.1:${port}`,
            changeOrigin: true,
            pathRewrite: {[`^/nrs`]: ''},
            on: {
                ...(rewriteEnvironments ? {proxyRes: createRewriteEnvironmentsAPIOnProxyResFunc()} : {}),
            },
        }),
    };
}
