import {createProxyMiddleware} from 'http-proxy-middleware';
import {createAPIGatewayLocalProxy, createAPIGatewayEnvironmentsProxy} from './proxy-factory';
import {ProxyRoute} from './types';

const servers = ['알림', '메인', 'NRS'];

const env = (() => {
    if (process.env.npm_lifecycle_event?.includes('LOCAL')) {
        return '로컬';
    }
    return process.env.npm_lifecycle_event?.split('start:proxy-')?.[1] ?? 'DV/ST/QA';
})();

class _프록시_설정_빌더 {
    proxies: ProxyRoute[] = [];
    locals: string[] = [];

    아무것도_로컬로_안_띄울래요() {
        console.log(`\x1b[31m모든 서버를 ${env}로 연결중입니다.\x1b[0m`);
        return this.proxies;
    }

    메인을_로컬로_띄울래요(port = 8088) {
        this.proxies.push(createAPIGatewayEnvironmentsProxy(port, true));
        this.proxies.push(createAPIGatewayLocalProxy('main', port));
        this.locals.push('메인');
        return this;
    }

    NRS를_로컬로_띄울래요(port = 8055) {
        this.proxies.push(createAPIGatewayEnvironmentsProxy(port, true));
        this.proxies.push(createAPIGatewayLocalProxy('nrs', port));
        this.locals.push('NRS');
        return this;
    }

    알림을_로컬로_띄울래요(port = 8066) {
        this.proxies.push(createAPIGatewayLocalProxy('notification', port));
        this.locals.push('알림');
        return this;
    }

    설정_끝() {
        if (this.locals.length > 0) {
            console.log(`\x1b[31m로컬에 연결중인 서버들: ${this.locals.join(', ')}\x1b[0m`);
        }

        if (servers.filter(it => !this.locals.includes(it)).length > 0) {
            console.log(`\x1b[31m${env}에 연결중인 서버들: ${servers.filter(it => !this.locals.includes(it)).join(', ')}\x1b[0m`);
        }

        return this.proxies;
    }
}

export const 프록시_설정_빌더 = new _프록시_설정_빌더();
