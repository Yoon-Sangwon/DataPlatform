import {createProxyMiddleware} from 'http-proxy-middleware';
import {createRewriteEnvironmentsAPIOnProxyResFunc, getHostSuffix, getRemovedSecureCookie, replaceDevURLToLocalURL, rewriteJSONBody} from './utils';

async function getOverrideProxies() {
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const {proxy} = await import('./proxy-local-override');
        return proxy;
    } catch (_) {
        return [];
    }
}

export async function getProxy(proxy: string) {
    const hostSuffix = getHostSuffix(proxy);

    return [
        ...(await getOverrideProxies()),
        {
            match: ({path}) => path.includes('/main/auth/callback'),
            middleware: createProxyMiddleware({
                target: `https://unknown.csr.${hostSuffix}`,
                changeOrigin: true,
                secure: false,
                autoRewrite: true,
                protocolRewrite: 'http',
                router: req => {
                    const tenantName = req.headers.host?.split('.')[0];
                    return `https://${tenantName}.csr.${hostSuffix}`;
                },
            }),
        },
        {
            match: ({host}) => host.includes('api-agw-backend.hrp.kr-local-jainwon.com'),
            middleware: createProxyMiddleware({
                target: `https://api-agw-backend.hrp.${hostSuffix}`,
                changeOrigin: true,
                secure: false,
                autoRewrite: true,
                protocolRewrite: 'http',
                on: {
                    proxyRes: createRewriteEnvironmentsAPIOnProxyResFunc(),
                },
            }),
        },
        {
            match: ({host}) => host.includes('auth.csr.kr-local-jainwon.com'),
            middleware: createProxyMiddleware({
                target: `https://auth.csr.${hostSuffix}`,
                changeOrigin: true,
                secure: false,
                cookieDomainRewrite: {
                    [`.csr.${hostSuffix}`]: '.csr.kr-local-jainwon.com',
                },
                on: {
                    proxyReq: proxyReq => {
                        proxyReq.setHeader('origin', `https://auth.csr.${hostSuffix}`);
                    },
                    proxyRes: (proxyRes, req, res) => {
                        if (proxyRes.headers['access-control-allow-origin']) {
                            proxyRes.headers['access-control-allow-origin'] = req.headers.origin;
                        }
                        if (proxyRes.headers.location) {
                            proxyRes.headers.location = replaceDevURLToLocalURL(proxyRes.headers.location, proxy);
                        }
                        if (proxyRes.headers['set-cookie']) {
                            proxyRes.headers['set-cookie'] = getRemovedSecureCookie(proxyRes.headers['set-cookie']);
                        }
                        if (proxyRes.url.includes('/subscribe')) {
                            console.log(proxyRes, res);
                        }
                        const isLoginAPI = req.method === 'POST' && /\/auth\/(v\d+\/)?login/.test(req.url!);
                        const isDupleLoginAPI = req.method === 'POST' && /\/auth\/(v\d+\/)?duple-login/.test(req.url!);

                        if (isLoginAPI || isDupleLoginAPI) {
                            rewriteJSONBody(proxyRes, req, res, json => {
                                if (json?.nextUrl) {
                                    json.nextUrl = replaceDevURLToLocalURL(json.nextUrl, proxy);
                                }
                                return json;
                            });
                        }
                    },
                },
            }),
        },
    ];
}
