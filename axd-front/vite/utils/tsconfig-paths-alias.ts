import {existsSync, readFileSync} from 'fs';
import {dirname, normalize, resolve} from 'path';
import {fileURLToPath} from 'url';
import type {Plugin} from 'vite';

/**
 * tsconfig.json의 paths를 읽어서 resolve.alias에 자동으로 추가하는 플러그인
 * SCSS @import에서도 경로 별칭을 사용할 수 있도록 함
 *
 * 리눅스/윈도우 크로스 플랫폼 지원:
 * - path.resolve()를 사용하여 경로 구분자를 자동 처리
 * - normalize()를 사용하여 경로 정규화
 * - import.meta.url을 사용하여 플러그인 파일 위치 기준으로 경로 해석
 */
export function tsconfigPathsAliasPlugin(): Plugin {
    // 플러그인 파일의 위치를 기준으로 프로젝트 루트 찾기
    // vite/utils/tsconfig-paths-alias.ts -> packages/csr-client-web/vite/utils -> packages/csr-client-web
    const pluginDir = dirname(fileURLToPath(import.meta.url));
    const defaultProjectRoot = resolve(pluginDir, '../..');

    return {
        name: 'tsconfig-paths-alias',
        config(config) {
            try {
                // 프로젝트 루트 경로 결정 (여러 방법 시도)
                // 리눅스 CI 환경에서 config.root가 제대로 설정되지 않을 수 있으므로
                // 플러그인 파일 위치를 기준으로 한 fallback 제공
                const candidateRoots = [config.root && normalize(config.root), normalize(defaultProjectRoot), normalize(process.cwd())].filter(
                    (root): root is string => root !== undefined && root !== '',
                );

                let projectRoot: string | undefined;
                let tsconfigPath: string | undefined;

                // 여러 경로 후보를 시도
                for (const candidateRoot of candidateRoots) {
                    const candidatePath = resolve(candidateRoot, 'tsconfig.json');
                    if (existsSync(candidatePath)) {
                        projectRoot = candidateRoot;
                        tsconfigPath = candidatePath;
                        break;
                    }
                }

                if (!projectRoot || !tsconfigPath) {
                    console.warn('[tsconfig-paths-alias] tsconfig.json not found. Tried paths:');
                    candidateRoots.forEach(root => {
                        console.warn(`  - ${resolve(root, 'tsconfig.json')}`);
                    });
                    return;
                }

                // UTF-8 인코딩으로 파일 읽기 (리눅스 환경에서도 동일하게 작동)
                const tsconfigContent = readFileSync(tsconfigPath, 'utf-8');
                const tsconfig = JSON.parse(tsconfigContent);

                // paths 설정 추출
                const paths = tsconfig.compilerOptions?.paths;
                if (!paths || typeof paths !== 'object') {
                    return;
                }

                // paths를 resolve.alias 형식으로 변환
                const aliases: Record<string, string> = {};

                for (const [alias, pathArray] of Object.entries(paths)) {
                    if (!Array.isArray(pathArray) || pathArray.length === 0) {
                        continue;
                    }

                    // '@app/*' -> '@app', './src/app/*' -> './src/app'
                    const aliasKey = alias.replace(/\/\*$/, '');
                    const pathValue = pathArray[0].replace(/\/\*$/, '');

                    // 절대 경로로 변환 (크로스 플랫폼 지원)
                    // path.resolve()는 리눅스/윈도우 경로 구분자를 자동으로 처리
                    const resolvedPath = normalize(resolve(projectRoot, pathValue));
                    aliases[aliasKey] = resolvedPath;
                }

                // resolve.alias에 paths에서 추출한 별칭 병합
                // 기존 alias가 있으면 우선순위를 가짐
                return {
                    resolve: {
                        alias: {
                            ...aliases,
                            ...config.resolve?.alias,
                        },
                    },
                };
            } catch (error) {
                console.warn('[tsconfig-paths-alias] Failed to read tsconfig.json:', error);
            }
        },
    };
}
