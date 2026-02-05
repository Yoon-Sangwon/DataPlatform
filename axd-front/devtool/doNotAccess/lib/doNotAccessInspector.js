const fs = require('fs');
const path = require('path');
const voRegex = new RegExp(/(?<!\temp\b)VO\/(?!\bcommon\b)/);
const rqrsRegex = new RegExp(/network\/http\/rqrs/);
const pageRegex = new RegExp(/\/page\//);

const walk = (dir, done) => {
    let results = [];
    fs.readdir(dir, (err, list) => {
        if (err) return done(err);
        let i = 0;
        (function next() {
            let file = list[i++];
            if (!file) return done(null, results);
            file = path.resolve(dir, file);
            fs.stat(file, (err, stat) => {
                if (stat && stat.isDirectory()) {
                    walk(file, (err, res) => {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
};

module.exports = {
    /**
     * @template T {{[key in string]:RegExp}}
     * @param inspectionPath {string} 예) '../../packages/hrp-client-web/src/app/gadget'
     * @param itemsToCheck {T} 예) {page: new Regex(/\/page\//), vo: ...}
     * @returns {Promise<{[key in keyof T]: string[]}>} 예) {page: ['/Component.tsx']}
     */
    inspection: (inspectionPath, itemsToCheck) => {
        return new Promise((resolve, reject) => {
            try {
                walk(inspectionPath, async (err, result) => {
                    const errorList = {};
                    Object.keys(itemsToCheck).forEach(key => {
                        errorList[key] = [];
                    });
                    await Promise.all(result.map(file => {
                        return new Promise(resolve => {
                            fs.readFile(file, (err, data) => {
                                const code = data.toString();
                                Object.entries(itemsToCheck).forEach(([key, regex]) => {
                                    if (regex.test(code)) {
                                        errorList[key].push(file.split(inspectionPath)[1].replaceAll('\\', '/'));
                                    }
                                });
                                resolve();
                            });
                        });
                    }));
                    resolve(errorList);
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
