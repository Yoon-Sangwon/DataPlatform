import {fileURLToPath} from 'url';

export async function resolveToFilePath(specified: string) {
    return fileURLToPath(await import.meta.resolve!(specified, import.meta.url));
}
