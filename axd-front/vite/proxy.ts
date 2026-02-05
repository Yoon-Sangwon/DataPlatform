import {ViteDevServer} from 'vite';
import {getProxy as getProxyDev} from './proxy-dev';
import {proxy as proxyLocal} from './proxy-local';
import {ProxyRoute} from './utils';

interface ProxyOptions {
    proxy: string;
}

export async function proxyPlugin({proxy}: ProxyOptions) {
    const routes: ProxyRoute[] = proxy === 'LOCAL' ? proxyLocal : await getProxyDev(proxy);

    const configureServer = (server: ViteDevServer) => {
        server.middlewares.use((req, res, next) => {
            const host = req.headers.host ?? '';
            const path = req.url ?? '';

            const matchedRoute = routes.find(route => route.match({host, path, req}));
            if (matchedRoute !== undefined) {
                matchedRoute.middleware(req, res, next);
                return;
            }

            next();
        });
    };

    return {
        name: 'proxy',
        configureServer,
        configurePreviewServer: configureServer,
    };
}
