import {IncomingMessage, ServerResponse} from 'http';
import {getHostSuffix} from './config';

export function escapeRegex(string: string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function replaceDevURLToLocalURL(url: string, proxy: string) {
    const hostSuffixRegex = new RegExp(`https://(.+)\\.csr\\.${escapeRegex(getHostSuffix(proxy))}`);

    return url.replace(hostSuffixRegex, 'http://$1.csr.kr-local-jainwon.com:12083');
}

export function getRemovedSecureCookie(cookie: string[]) {
    return cookie.map(_cookie => {
        return _cookie
            .split(';')
            .filter(v => v.trim().toLowerCase() !== 'secure')
            .join('; ');
    });
}

export function rewriteJSONBody(proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse, bodyMapper: (json: any) => any) {
    const originalWrite = res.write;
    const originalEnd = res.end;

    if ('content-length' in proxyRes.headers) {
        delete proxyRes.headers['content-length'];
    }

    const buffers: Buffer[] = [];

    res.write = function write(data: Buffer) {
        buffers.push(data);
        return true;
    };

    res.end = function end() {
        const fullData = Buffer.concat(buffers);

        try {
            const responseJSON = JSON.parse(fullData.toString());
            const newJSON = bodyMapper(responseJSON);
            originalWrite.call(res, JSON.stringify(newJSON));
        } catch (e) {
            console.error(e);
            return originalWrite.call(res, fullData);
        }

        originalEnd.call(res);
        return this;
    };
}
