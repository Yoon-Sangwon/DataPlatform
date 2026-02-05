export function getHostSuffix(proxy = 'DEV') {
    switch (proxy) {
        case 'DEV':
            return 'kr-dv-jainwon.com';
        case 'ST':
            return 'kr-st-jainwon.com';
        case 'ST2':
            return 'kr-st2-jainwon.com';
        case 'PR':
            return 'kr-pr-jainwon.com';
        default:
            throw new Error(`PROXY_DEST_ENV is invalid : ${proxy}`);
    }
}
