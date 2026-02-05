## proxy-local-override.ts 사용 방법

1. 현재 폴더에 proxy-local-override.ts를 만들고 아래 코드를 붙여넣습니다.
2. 로컬 서버로 연결하고 싶은 것만 남기고 지웁니다.
3. 설정이 끝나면 설정_끝()을 호출합니다. (하지 않으면 동작하지 않습니다.)
4. 아무것도 로컬로 띄우고 싶지 않다면, 아무것도_로컬로_안_띄울래요()를 호출합니다.

```javascript
import {프록시_설정_빌더} from './proxy-override-builder';

// prettier-ignore
export const proxy = 프록시_설정_빌더
    .메인을_로컬로_띄울래요()
    .NRS를_로컬로_띄울래요()
    .알림을_로컬로_띄울래요()
    .설정_끝();
```
