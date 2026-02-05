const path = require('path');
const inspector = require("./lib/doNotAccessInspector");
const voRegex = new RegExp(/(?<!\temp\b)VO\/(?!\bcommon\b)/);
const rqrsRegex = new RegExp(/network\/http\/rqrs/);
const pageRegex = new RegExp(/\/page\//);

inspector.inspection(
    path.resolve(__dirname, '../../packages/hrp-client-web/src/app/gadget'),
    {
        vo: voRegex,
        rqrs: rqrsRegex,
        page: pageRegex,
    }
).then(errorList => {
    console.log(`가젯에서 VO 접근(${errorList.vo.length}개)`, errorList.vo);
    console.log(`가젯에서 RQ/RS 접근(${errorList.rqrs.length}개)`, errorList.rqrs);
    console.log(`가젯에서 페이지 코드 접근(${errorList.page.length}개)`, errorList.page);
});

inspector.inspection(
    path.resolve(__dirname, '../../packages/hrp-client-web/src/app/module'),
    {page: pageRegex}
).then(errorList => {
    console.log(`모듈에서 페이지 코드 접근(${errorList.page.length}개)`, errorList.page);
});
