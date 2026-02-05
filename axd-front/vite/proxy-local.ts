import {createProxyMiddleware} from 'http-proxy-middleware';
import {ProxyRoute, createAPIGatewayEnvironmentsProxy, createAPIGatewayLocalProxy} from './utils';

export const proxy: ProxyRoute[] = [
    {
        match: ({path}) => path.includes('/auth/callback'),
        middleware: createProxyMiddleware({target: 'http://localhost:8088'}),
    },
    createAPIGatewayEnvironmentsProxy(8055, true), // 2번째 인자가 true면 eviroments url을 12083으로 응답 조작함. (dev 서버 프록시 처리 용도)
    createAPIGatewayLocalProxy('nrs', 8055),
    createAPIGatewayLocalProxy('main', 8088),
    createAPIGatewayLocalProxy('notification', 8066),

    // 포트번호 참고 할 겸 남겨둠
    // createAPIGatewayLocalProxy('performance', 8080),
    // createAPIGatewayLocalProxy('hrappraisal', 7080),
    // createAPIGatewayLocalProxy('meeting', 8081),
    // createAPIGatewayLocalProxy('talent', 8077),
    // createAPIGatewayLocalProxy('report', 8082),
];
