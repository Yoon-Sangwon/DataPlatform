const express = require('express');
const {createProxyMiddleware} = require("http-proxy-middleware");
const {getInterserviceHostSuffix} = require("./host");

/**
 * @typedef {Object} HRPProxyOptions
 * @property {string} target
 * @property {string?} hostInLocal
 * @property {number} port
 */

/**
 * @param {HRPProxyOptions} options
 */
function createHRPProxyMiddleware(options) {
    return createProxyMiddleware(
        (path, req) => {
            if (!options.hostInLocal) {
                return true;
            }
            return req.headers.host === `${options.hostInLocal}:${options.port}`;
        },
        {
            target: options.target,
            changeOrigin: true,
            secure: false,
            cookieDomainRewrite: {
                [`.hrp.${getInterserviceHostSuffix()}`]: '.hrp.kr-local-jainwon.com'
            },
            onProxyReq: (proxyReq, req, res) => {
                proxyReq.setHeader('origin', options.target);
            },
            onProxyRes: (proxyRes, req, res) => {
                if (proxyRes.headers['access-control-allow-origin']) {
                    proxyRes.headers['access-control-allow-origin'] = req.headers.origin;
                }
            }
        }
    );
}

/**
 * @param {HRPProxyOptions} options
 */
function startHRPProxy(options) {
    const authProxyApp = express();
    authProxyApp.use(createHRPProxyMiddleware(options));
    authProxyApp.listen(options.port);
}


/**
 * aaa.kr-local-jainwon.com으로 오는 요청을 인식해서 8083으로 보내기 위해 테넌트(aaa)를 추출하여 target에 적용
 * @param {HRPProxyOptions} options
 */
function startINHRProxy(options) {
    const authProxyApp = express();
    authProxyApp.use(function (_req, _res, _next) {
        console.log(options.target.replace('$tenant$', _req.hostname.split('.')[0]));
        createProxyMiddleware((path, req) => {
            if (!options.hostInLocal) {
                return true;
            }
            return req.headers.host === `${options.hostInLocal}:${options.port}`;
        }, {
            target: options.target.replace('$tenant$', _req.hostname.split('.')[0]),
            changeOrigin: true,
            secure: false,
            cookieDomainRewrite: {
                [`.hrp.${getInterserviceHostSuffix()}`]: '.hrp.kr-local-jainwon.com'
            },
            onProxyReq: (proxyReq, req, res) => {
                proxyReq.setHeader('origin', options.target.replace('$tenant$', req.hostname.split('.')[0]));
            },
            onProxyRes: (proxyRes, req, res) => {
                if (proxyRes.headers['access-control-allow-origin']) {
                    proxyRes.headers['access-control-allow-origin'] = req.headers.origin;
                }
            }
        })(_req, _res, _next);
    });
    authProxyApp.listen(options.port);
}

/**
 * 특정포트로 오는 모든 요청을, 특정 target으로 단순히 보내버리기만 하는 프록시
 * @param {HRPProxyOptions} options
 */
function startSimpleProxy(options) {
    const authProxyApp = express();
    authProxyApp.use(function (_req, _res, _next) {
        createProxyMiddleware(() => true, {
            target: options.target
        })(_req, _res, _next);
    });
    authProxyApp.listen(options.port);
}

module.exports = {
    startHRPProxy, startINHRProxy, startSimpleProxy
};
