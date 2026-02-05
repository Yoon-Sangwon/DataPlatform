/**
 * @type {"DEV" | "ST" | "ST2" | "PR"}
 */
const PROXY_DEST_ENV = process.env.PROXY_DEST_ENV;

function getInterserviceHostSuffix() {
    switch (PROXY_DEST_ENV) {
        case "DEV":
            return 'kr-dv-jainwon.com';
        case "ST":
            return 'kr-st-jainwon.com';
        case "ST2":
            return 'kr-st2-jainwon.com';
        case "PR":
            return 'kr-pr-jainwon.com';
        default:
            throw new Error(`PROXY_DEST_ENV is invalid : ${PROXY_DEST_ENV}`);
    }
}

module.exports = {
    getInterserviceHostSuffix
};
