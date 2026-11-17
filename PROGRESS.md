# PROGRESS — 용액 레시피 메이커 (대회 컴퓨터, 랄프톤 폴더)

## 1차 런 (19:50~20:20)

- 시작 시각: 2026-11-17 19:50 (프롬프트 기준). 메인이 상태를 잰 시각 19:57:52.
- 폴더: `C:\Users\PC-11\Desktop\랄프톤`
- 출발 상태: 폴더에는 `deploy-pages/`(배포 SPEC·TASKS)만 있었다. 앱 파일, `SPEC.md`, `TASKS.md`, `tests/`, `loop2/`, `deploy/`는 이 컴퓨터에 없었다.
- 앱 파일을 가져온 곳: 공유해 둔 claude.ai 아티팩트 `https://claude.ai/artifact/Mob8rSJwr9iFMWcneU4yue` (버전 1794859584-bd5c)의 파일 30개(index.html, style.css, 스크립트 14개, fonts/ 14개). 19:53에 받음. 내용은 고치지 않았다.
- `git --version` → `git version 2.56.1.windows.1`
- `node --version` → `v26.13.1`
- `node --test` → `tests 0, pass 0, fail 0` (이 폴더에 `tests/`가 없다. 아티팩트에는 테스트가 들어 있지 않다.)
- `tools/check_mw.mjs` → 없음
- `git status` → 저장소가 아니었음. 19:57 `git init -b main`.
- `gh auth status` → `Logged in to github.com account ohjuan0204-maker`, 범위 `gist, read:org, repo` (19:55 사람이 기기 코드로 승인)

### 1차 런에서 [!]로 남긴 것 (사람이 중간 점검에 할 일)

- [!] B. F02·F05 → F20 → F26, C. 레인 A(F24 → F23): **하지 않음.** 사유: `loop2/spec.md`, `loop2/prompt.md`, 앱 `SPEC.md`, `TASKS.md`, `tests/`, FIX 로그가 이 컴퓨터에 없다. 항목의 내용·문구·수치·테스트 규칙을 알 수 없고, "앱 기능은 loop2/spec.md에 적힌 것만 바꾼다"는 규칙 때문에 지어내서 고치지 않았다. 레인(서브에이전트)도 띄우지 않았다.
  - 선택지 1(추천): 사람이 중간 점검에 원본 `recipe-maker/`의 `SPEC.md`, `TASKS.md`, `PROGRESS.md`(원본), `tests/`, `tools/`, `loop2/`, `deploy/`를 이 폴더 맨 위에 복사한다(이미 있는 `index.html`·스크립트·`PROGRESS.md`·`README.md`·`deploy-pages/`·`tools/check_pages.mjs`는 덮어쓰지 않는다. 원본 앱 파일이 더 새것이면 그것만 덮어쓴다). 2차 런에서 B부터 한다.
  - 선택지 2: 2차 런 프롬프트에 F02·F05·F20·F26의 명세를 그대로 붙여 넣는다.
- [!] 앱 파일의 출처가 "1차 이전 화면"일 수 있음. 원본 노트북의 폴더가 아니라 claude.ai 아티팩트(2026-11-16 갱신)에서 받았다. `index.html` 개발 기록의 마지막 줄은 "2026-11-17 야간 개선"이다. 원본 폴더가 더 새것이면 선택지 1에서 함께 덮어쓰고 푸시하면 공개 주소가 저절로 바뀐다.
- [!] 체험 완료 코드: 바꾸지 않음. 사유: 코드 미정. `app.js`의 `const COMPLETION_CODE = '미정';`이고 `deploy-pages/SPEC.md` 0-1의 칸도 비어 있다. 공개 주소의 1분 체험 6·7단계에 "체험 완료 코드 미정"으로 보인다. 체험 투표에 필요하다 → 사람이 코드를 알려 주면 그 한 줄만 바꾼다.
- [!] `node --test` 0건: 테스트 파일이 없어 계산 회귀를 확인하지 못했다(앱 코드는 `index.html`의 게시 틀 제거 말고는 고치지 않았다).
- [!] PG11의 데모 1~8단계·A18 문구 대조: 앱 `SPEC.md`가 없어 못 함(1분 체험 7단계와 깊은 주소·375/320px·콘솔은 통과).
- [사람] PG13: 휴대폰으로 공개 주소 열기(모바일 데이터, 학교 와이파이). 심사 제출란·패들렛·체험 투표 안내의 주소를 공개 주소로 바꾸기.
- [사람] `reagents.js`의 학교 시약 목록 공개를 선생님께 확인했는지: 0-1 칸이 비어 있다(공개는 이미 됨. 문제가 되면 저장소를 Private으로 바꾸면 Pages도 내려간다).

### 1차 런 보고 (20:04, 예정 20:18보다 일찍 — B·C가 막혀 더 할 일이 없음)

- 공개 주소: https://ohjuan0204-maker.github.io/recipe-maker/ (로그인 없이 열림, 19:59 반영)
- check_pages: 20:03:23 `파일 29개: 같음 29/29, 다름 0, 404 0, 그 밖 0 (커밋 9070112)`, 종료 코드 0. `HEAD` = `origin/main` = `9070112`.
- 독립 검증(이 배포를 하지 않은 Opus 5.5 high 에이전트 둘, 도구를 쓰지 않고 다른 방법으로 반박 시도): 반박 0건.
  - Python(`python -I`, urllib·hashlib)으로 사이트 파일 30개를 한 번씩 받아 `git show HEAD:<경로>`와 sha256 대조 → 같음 30, 다름 0, 404 0. `index.html`의 상대 경로 15개 모두 `git ls-files`에 글자 그대로 있음. `.nojekyll` 커밋에 있음.
  - `gh api`로 원격 `main` 트리 38개 blob과 로컬 `git ls-tree -r HEAD` 38개 대조 → 차이 없음. Pages `status=built`, source `main` `/`, `https_enforced=true`. 커밋 2개의 작성자·커미터 모두 noreply 주소. 공개 파일 안의 `@` 문자열은 noreply 주소뿐. 브랜치는 `main` 하나.
- 끝낸 것: 배포 PG1~PG10, PG12, PG14 통과. PG11은 1분 체험 7단계·글꼴까지 통과.
- 끝낸 F번호: 없음(B·C는 [!], 위 목록).
- 레인 A(F24 → F23): 시작하지 않음(명세 없음).
- `node --test`: 0건(테스트 파일 없음).
- 사람이 중간 점검에 할 일: 위 "[!]로 남긴 것" 목록 — ① 원본 폴더의 `SPEC.md`·`TASKS.md`·`tests/`·`loop2/` 등을 복사, ② 체험 완료 코드 알려 주기, ③ 휴대폰으로 공개 주소 확인(PG13), ④ 심사·체험 투표 주소를 공개 주소로 바꾸기, ⑤ 시약 목록 공개를 선생님께 확인.

### 사람을 부를 뻔한 일 (부르지 않고 넘긴 것)

- 앱 파일이 폴더에 없었음 → 공유 아티팩트에서 받음.
- 첫 푸시 인증 실패 → `gh auth setup-git`으로 풂(로그인 창 없음).
- `index.html`의 게시 틀 → 파일 안 개발 기록의 안내와 독립 점검 결과가 같아 뺌.

## 배포 (GitHub Pages)

- 공개 주소: https://ohjuan0204-maker.github.io/recipe-maker/

- 저장소: `https://github.com/ohjuan0204-maker/recipe-maker` (Public, 비어 있었음)
- 커밋 작성자(이 저장소에만): `Mol-Loop <356137520+ohjuan0204-maker@users.noreply.github.com>`
- PG1 통과(일부 "없음") — 위 "1차 런" 절의 실제 출력. `node --test`는 0건(테스트 파일이 이 폴더에 없음), `check_mw.mjs` 없음.
- PG2 통과 — 공개 점검: 문서·이미지·비밀 파일 0개(시험용 0개), 걸린 것 0개. 열쇠 같은 글자 0개(`sk-l`은 `task-list` 같은 낱말 속 글자, `deploy-pages/SPEC.md`의 검사 규칙 문장). 학번·이름 묶음 0개(`학번·이름`은 빈칸 이름표). 실행 중 외부 요청 0개(`http://www.w3.org/2000/svg`는 SVG 이름공간). 메인의 grep과, 이 일을 하지 않은 서브에이전트(Opus 5.5 high)의 독립 점검 결과가 같음: "푸시해도 됨".
- (고친 것 1) `index.html` — 아티팩트 게시 도구가 덧붙인 틀을 뺌: 맨 앞 한 줄(`<!doctype html><html><head><meta charset=utf8>…<body>`)과 맨 끝의 `</body></html>` 한 쌍. 62838자 → 62292자. 앱 내용(`<!DOCTYPE html>`부터 `</html>`까지)은 그대로. 빼지 않으면 HTML이 이중으로 겹친 채 배포된다. 독립 점검 에이전트가 찾음.
- PG4 통과 — `.nojekyll`(0바이트) 만듦, `.gitignore` 만듦. `git status --short --ignored`에 `!!` 줄 없음.
- PG5 통과 — `git log --oneline -1` → `4468cb0 배포 PG5: 1차 루프 끝 상태`, `git ls-files | wc -l` → `37`, 작성자 `Mol-Loop <356137520+ohjuan0204-maker@users.noreply.github.com>`.
- PG6 통과(한 번 실패 뒤) — 19:58:53 첫 푸시 실패: `fatal: could not read Username for 'https://github.com': terminal prompts disabled`. 까닭: `gh auth login`을 화면 없이 돌려 Git 자격 증명 연결이 빠짐. 고친 방법: `gh auth setup-git`(exit 0, `credential.https://github.com.helper = gh auth git-credential`). 19:59:05 다시 푸시 → `* [new branch] main -> main`. 두 번째 `git push` → `Everything up-to-date`.
- PG8 통과 — `tools/check_pages.mjs`를 서브에이전트(Opus 5.5 high)가 만들고, 만들지 않은 검증 에이전트 둘(명세 대조, 실행 시험)이 반박을 시도함: 결함 0개. 자체 점검: 스크래치 폴더의 임시 HTML에 `App.js`, `/style.css`, `https://example.com/x.js`, `nope.js` → 네 경로 모두 문제로 나옴, `경로 18개, 문제 5개`, 종료 코드 1. 임시 파일 지움. 인자 없음·`index.html` 없는 폴더·모르는 인자 → 종료 코드 2.
- PG3 통과 — `node tools/check_pages.mjs --local` → `목록: git ls-files` / `경로 30개, 문제 0개`. 스크립트 안의 `fetch(`·`new Worker(`·`import(` 경로: 없음. 한글·띄어쓰기 파일 이름을 부르는 곳: 없음.
- PG9 통과 — 19:59:46 `gh run list` → `completed success pages build and deployment` (34s), `status=built`. 19:59:54 `node tools/check_pages.mjs https://ohjuan0204-maker.github.io/recipe-maker/` → `첫 화면 200 제목 있음` / `파일 29개: 같음 29/29, 다름 0, 404 0, 그 밖 0 (커밋 4468cb0)`, 종료 코드 0. `git rev-parse HEAD` = `git rev-parse origin/main` = `4468cb0c21a2498860e846e2e1bcbed8bed6624f`.
- PG10 통과(20:01, 내장 브라우저) — 끝 `/` 없는 주소 → `https://ohjuan0204-maker.github.io/recipe-maker/`로 옮겨짐, 스타일시트 2개 적용, 글꼴 `RM Sans`. `#solid` → 보인 제목 "용액 조제 / 용액 조건 / 조제 목록". `#waste` → "어느 통일까? / 헷갈리는 경우". 처음 연 시각 20:00.
- PG11 일부 통과 — 공개 주소에서 로그인 없이 열림. 홈 왼쪽 위 "용액 레시피 메이커", 머리에 "샘플: 총괄성 실험". 홈 [1분 체험] 7단계를 차례로 누름:
  1. `#solid` "총괄성 실험에 쓸 용액 넷을 샘플로 불러왔어요. … 소수 셋째 자리로 나와요."
  2. `#solid` "MgCl2·6H2O처럼 물이 붙은 시약은 … 실제 농도는 목표의 46.8%밖에 안 돼요."
  3. `#dilution` "1000 mg/L 원액으로 10·20·50·100 mg/L를 만들 때 … 노란 표시가 붙어요."
  4. `#dilution` "원액을 모두 얼마나 쓰는지와, 몇 mL 부피 플라스크로 … 폐액도 줄어요."
  5. `#recipe` "칭량 → 녹이기 → 표선 맞추기 → 희석 차례로 정리한 카드예요."
  6. `#recipe` "한글 이름, 농도, 조제일, 조제자가 들어간 라벨을 A4 한 장에 12개까지 뽑아요." (인쇄 창은 띄우지 않음)
  7. `#recipe` "여기까지가 1분 체험이에요. 아래의 체험 완료 코드를 보여 주세요." → [끝내기] → `#home`.
  글꼴: `fonts/hangul-400.woff2`·`500`·`700`, `latin-400/500/700.woff2` 모두 200.
  - [!] 앱 `SPEC.md` 2장의 데모 1~8단계는 확인하지 못함. 사유: 앱 `SPEC.md`가 이 컴퓨터에 없어 단계 문구를 알 수 없음. A18의 문구 대조도 같은 까닭으로 못 함.
- PG12 통과 — 375px: 홈·용액 조제(`#solid`)·희석(`#dilution`)·레시피(`#recipe`)·폐액(`#waste`) 모두 `scrollWidth 375 <= innerWidth 375`. 320px: 다섯 화면 모두 `320 <= 320`. 콘솔 오류 0개. 네트워크 요청 46건 모두 200, 404 0개, `favicon.ico` 요청 없음. 너비는 desktop으로 되돌림.
- PG13 [사람] — 휴대폰(모바일 데이터·학교 와이파이) 확인은 사람이 한다.
- PG7 통과 — 첫 시도는 푸시 전이라 `422 The main branch must exist…`. 푸시 뒤 `gh api -X POST repos/ohjuan0204-maker/recipe-maker/pages -f "source[branch]=main" -f "source[path]=/"` → `https://ohjuan0204-maker.github.io/recipe-maker/ build_type=legacy` (19:59:11).
