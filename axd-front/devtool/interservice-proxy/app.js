const {startHRPProxy, startINHRProxy, startSimpleProxy} = require("./util/proxy");
const {getInterserviceHostSuffix} = require("./util/host");

// startHRPProxy({
//     target: `https://auth.hrp.${getInterserviceHostSuffix()}`,
//     port: 8099
// });
//
// startHRPProxy({
//     target: `https://api.cms.hrp.${getInterserviceHostSuffix()}`,
//     port: 9080
// });
//
// startHRPProxy({
//     target: `https://api-appraisal.hrp.${getInterserviceHostSuffix()}`,
//     port: 7080
// });

/*
startHRPProxy({
    target: `https://api-performance.hrp.${getInterserviceHostSuffix()}`,
    port: 8080
});
*/

/*startHRPProxy({
    target: `https://api.appr.hrp.${getInterserviceHostSuffix()}`,
    port: 8081
});*/

/*
startINHRProxy({
    target: `http://$tenant$.hrp.kr-local-jainwon.com:8083`,
    port: 80
});
*/

// startSimpleProxy({
//     target: `http://127.0.0.1:8081`,
//     port: 8084
// });
