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
- [!] PG11 데모 1~8단계는 공개 주소에서 직접 조작해 통과(아래 "배포" 절, 숫자는 Node 재계산과 같음). 다만 단계 순서는 `app.js`의 "계획서의 데모 순서" 주석과 `TOUR`에서 가져왔고, 앱 `SPEC.md` 2장·A18 원문과의 글자 대조는 파일이 없어 못 함.
- [사람] PG13: 휴대폰으로 공개 주소 열기(모바일 데이터, 학교 와이파이). 심사 제출란·패들렛·체험 투표 안내의 주소를 공개 주소로 바꾸기.
- [사람] `reagents.js`의 학교 시약 목록 공개를 선생님께 확인했는지: 0-1 칸이 비어 있다(공개는 이미 됨. 문제가 되면 저장소를 Private으로 바꾸면 Pages도 내려간다).

### 1차 런 보고 (20:04, 예정 20:18보다 일찍 — B·C가 막혀 더 할 일이 없음)

- 공개 주소: https://ohjuan0204-maker.github.io/recipe-maker/ (로그인 없이 열림, 19:59 반영)
- check_pages: 20:03:23 `파일 29개: 같음 29/29, 다름 0, 404 0, 그 밖 0 (커밋 9070112)`, 종료 코드 0. `HEAD` = `origin/main` = `9070112`.
- 독립 검증(이 배포를 하지 않은 Opus 5.5 high 에이전트 둘, 도구를 쓰지 않고 다른 방법으로 반박 시도): 반박 0건.
  - Python(`python -I`, urllib·hashlib)으로 사이트 파일 30개를 한 번씩 받아 `git show HEAD:<경로>`와 sha256 대조 → 같음 30, 다름 0, 404 0. `index.html`의 상대 경로 15개 모두 `git ls-files`에 글자 그대로 있음. `.nojekyll` 커밋에 있음.
  - `gh api`로 원격 `main` 트리 38개 blob과 로컬 `git ls-tree -r HEAD` 38개 대조 → 차이 없음. Pages `status=built`, source `main` `/`, `https_enforced=true`. 커밋 2개의 작성자·커미터 모두 noreply 주소. 공개 파일 안의 `@` 문자열은 noreply 주소뿐. 브랜치는 `main` 하나.
- 끝낸 것: 배포 PG1~PG12, PG14 통과. PG11은 1분 체험 7단계, 글꼴, 그리고 직접 조작한 데모 1~8단계(20:06 추가, 숫자 재계산 일치)까지 통과. SPEC 원문 문구 대조만 남음.
- 끝낸 F번호: 없음(B·C는 [!], 위 목록).
- 레인 A(F24 → F23): 시작하지 않음(명세 없음).
- `node --test`: 0건(테스트 파일 없음).
- 사람이 중간 점검에 할 일: 위 "[!]로 남긴 것" 목록 — ① 원본 폴더의 `SPEC.md`·`TASKS.md`·`tests/`·`loop2/` 등을 복사, ② 체험 완료 코드 알려 주기, ③ 휴대폰으로 공개 주소 확인(PG13), ④ 심사·체험 투표 주소를 공개 주소로 바꾸기, ⑤ 시약 목록 공개를 선생님께 확인.

### 계획 B 절차로 멈춤 (20:10) — 막힌 단계: PG11 "앱 SPEC.md 2장 데모 1~8단계" 원문 확인

`deploy-pages/SPEC.md` 12장(원본 `deploy/spec.md` 6장)의 절차대로 그 자리에서 멈추고 적는다. 기본값으로 풀 수 없다(원문이 이 컴퓨터와, 에이전트가 닿을 수 있는 어느 곳에도 없다).

- 막힌 단계: PG11(T11)의 한 부분 — 앱 `SPEC.md` 2장의 데모 시나리오 1~8단계 **원문**과 공개 주소 화면을 대조하는 일. A18 문구 대조도 같다.
- 마지막 오류 글자: `ls: cannot access 'tests': No such file or directory` / `ls: cannot access 'loop2': No such file or directory` / `ls: cannot access 'deploy': No such file or directory` (19:56:43). 폴더 맨 위에 `SPEC.md`·`TASKS.md`도 없었다.
- 해 본 것(세 가지, 모두 원문을 찾지 못함):
  1. 이 컴퓨터에서 찾기: 랄프톤 폴더, 바탕 화면·다운로드·문서 폴더 → 앱 `SPEC.md` 없음. (드라이브 전체 검색은 사람이 중단시킴.)
  2. 공유 아티팩트 `Mob8rSJwr9iFMWcneU4yue`의 파일 30개 → 앱 파일뿐, `SPEC.md` 없음. `app.js` 4440행에 "1분 체험: 계획서의 데모 순서를 차례로 보여 준다 (SPEC 26장)"이라는 주석과 7항목만 있음.
  3. 같은 계정의 다른 아티팩트: "발표 차트"의 `flow.html`(다섯 단계 흐름과 신청서 검증값)·`tour.html`(1분 체험 7단계), "준비 현황" 문서에서 `데모|시나리오|A18|완료 코드` 검색 → 데모 1~8단계 원문 없음(완료 코드 언급 3곳뿐).
- 원문 없이 확인한 것(대신한 증거, 위 "배포" 절 PG11): 공개 주소에서 직접 조작한 8단계가 모두 통과. 발표 차트에 적힌 "신청서에 미리 적은 검증값"과도 같다 — `NaCl 0.100 M 250 mL → 1.461 g`, `MgCl₂·6H₂O 0.100 M 100 mL → 2.033 g`, `원액 합계 9.00 mL, 권장 조제량 10 mL` (화면 값, Node 재계산 값, 발표 차트 값 셋이 일치).
- 커밋은 남겼고 모두 푸시됨. 공개 주소는 떠 있고 `check_pages.mjs`는 `같음 29/29`다. 그래서 12장의 "zip → claude.ai 아티팩트" 대체 주소는 필요 없다. 심사·체험 투표 주소는 GitHub Pages 주소를 쓴다.
- `loop2/spec.md` 0장: 파일이 없어 적지 못함("없음").
- 사람이 풀 방법: 원본 `SPEC.md`를 이 폴더 맨 위에 복사한다 → 2차 런 첫 일로 2장 1~8단계와 7장 A18 문구를 공개 주소에서 다시 대조한다(5분 안쪽).

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
- PG11 데모 1~8단계 통과(20:06, 공개 주소에서 1분 체험을 쓰지 않고 직접 조작). 단계의 근거: 앱 `SPEC.md`가 이 컴퓨터에 없어 2장 원문은 볼 수 없다. 대신 `app.js` 4440행 주석 "1분 체험: 계획서의 데모 순서를 차례로 보여 준다 (SPEC 26장)"과 그 아래 `TOUR` 7항목(샘플로 칭량 질량 계산 → 수화물 보정 → 원액 하나로 여러 농도 → 권장 원액 조제량 → 레시피 카드 → 한글 라벨 → 체험 끝)의 순서를 따르고, 맨 앞에 "공개 주소를 로그인 없이 연다"를 두어 8단계로 했다. 화면의 숫자는 Node로 따로 계산해 견줌.
  1. 공개 주소 열기 → 로그인 화면 없음(`input[type=password]` 없음), 제목·머리 "용액 레시피 메이커". 통과.
  2. 머리의 [샘플 : 총괄성 실험] 누름 → `#solid`, "샘플을 불러왔습니다. 조제 목록과 희석 탭을 확인하세요." 조제 목록 넷: `NaCl 0.100 M 250 mL 1.461 g`, `MgCl2·6H2O 0.100 M 100 mL 2.033 g`, `포도당 0.500 M 100 mL 9.008 g`, `요소 0.500 M 100 mL 3.003 g`. Node 재계산: NaCl 58.443 → 1.461, MgCl2·6H2O 203.301 → 2.033, 포도당 180.156 → 9.008, 요소 60.056 → 3.003 (모두 같음). 통과.
  3. 수화물 보정 → MgCl2·6H2O 줄에 "수화물 보정됨" 배지가 보임. 95.211 / 203.301 = 46.8 % (1분 체험 문구의 46.8 %와 같음). 통과.
  4. `#dilution` → 메틸렌 블루, 원액 1000 mg/L: `10 mg/L 50 mL 0.50 mL 49.50 mL 피펫 오차 큼 — 중간 희석 권장`, `20 mg/L 1.00 / 49.00`, `50 mg/L 2.50 / 47.50`, `100 mg/L 5.00 / 45.00`. Node 재계산(C1V1 = C2V2) 네 줄 모두 같음. 통과.
  5. 권장 원액 조제량 → "원액 총 사용량 9.00 mL / 권장 원액 조제량 10 mL". 재계산 0.50+1.00+2.50+5.00 = 9.00. 통과.
  6. `#recipe` 레시피 카드 5장(고체 조제 4, 희석 계열 1): "염화 나트륨 1.461 g을 칭량한다. / 비커에서 증류수 약 125 mL에 완전히 녹인다. / 250 mL 부피 플라스크에 옮기고 표선까지 증류수를 채운다." … "원액은 모두 9.00 mL 필요하다. 권장 원액 조제량 10 mL." 통과.
  7. 라벨 미리보기(화면까지만) → 미리보기 보임, 1장에 라벨 8개: "염화 나트륨 0.100 M 조제일 2026. 11. 17. 조제자", … "메틸렌 블루 100 mg/L …", "1 / 1장". 인쇄 창은 띄우지 않음(`window.print` 호출 0회 확인). 통과.
  8. 체험 완료 코드 칸이 보임: "체험 완료 코드 미정". 칸은 통과, 코드 값은 아래 [!](미정).
  콘솔 오류 0개.
  - [!] 앱 `SPEC.md` 2장·7장 A18의 **원문 문구와 글자 대조**는 못 함(파일 없음). 원본 `SPEC.md`를 복사한 뒤 2차 런에서 문구만 다시 대조한다.
- PG12 통과 — 375px: 홈·용액 조제(`#solid`)·희석(`#dilution`)·레시피(`#recipe`)·폐액(`#waste`) 모두 `scrollWidth 375 <= innerWidth 375`. 320px: 다섯 화면 모두 `320 <= 320`. 콘솔 오류 0개. 네트워크 요청 46건 모두 200, 404 0개, `favicon.ico` 요청 없음. 너비는 desktop으로 되돌림.
- PG13 [사람] — 휴대폰(모바일 데이터·학교 와이파이) 확인은 사람이 한다.
- PG7 통과 — 첫 시도는 푸시 전이라 `422 The main branch must exist…`. 푸시 뒤 `gh api -X POST repos/ohjuan0204-maker/recipe-maker/pages -f "source[branch]=main" -f "source[path]=/"` → `https://ohjuan0204-maker.github.io/recipe-maker/ build_type=legacy` (19:59:11).

## 2차 런 (20:30~21:15)

- 출발 상태(20:25): 사람이 중간 점검에 복사해 넣은 것 — `SPEC.md`(26장), `TASKS.md`, `SURVEY.md`, `tests/`(테스트 파일 14개 + `fixtures/` 5개), `loop2/`, `deploy/`, `PROGRESS_원본.md`, `README_원본.md`, 고쳐진 `calc.js`(강산·강염기 pH에 Kw 반영). 없는 것: `fonts/chars.txt`, `tools/check_mw.mjs`, `tools/build_fonts.py`, `tests/fixplan.test.js`, `fix_plan.md`, `FIX.md`, SPEC 27장.
- 체험 완료 코드: 프롬프트의 칸은 `____`였지만 사람이 채팅으로 "체험완료 코드는 1004"라고 알려 줌 → 1004를 쓴다. 중간 점검 할 일 5번(시약 목록 선생님 확인)은 사람이 "생략"이라고 함.
- 공개 점검(새 파일, 푸시 전): 이 일을 하지 않은 서브에이전트 셋(Opus 5.5 high)이 문서 개인정보 / `tests/fixtures` 속 내용과 메타데이터 / 열쇠·외부 주소를 따로 점검 → 셋 다 "푸시해도 됨". 실명·학번·전화·실제 메일·학교 이름·열쇠 0건. `fixtures`의 docx·xlsx 작성자 메타데이터는 `python-docx`·`openpyxl`(사람 이름 없음), 값은 SPEC A77·A97의 시험값. "확인 필요" 1건: `tests/calc.test.js` 199·201·202행의 조제자 예시 이름 `김가람` → 실제 사람인지 알 수 없어 묻지 않고 `홍길동`으로 바꿈(3곳, 테스트는 그대로 통과).

### B0 기준선 + pH 수정

- `node --test`(20:28) → `tests 118, pass 117, fail 1`. 실패 1건: `A56 글꼴` — `ENOENT: no such file or directory, open '…\fonts\chars.txt'`(원본 폴더의 `fonts/chars.txt`가 복사되지 않음. 코드 문제가 아니라 파일이 없는 것).
- 고친 방법(1줄 수정은 아니지만 파일 복원): 서브에이전트가 `fonts/`의 woff 여섯 개에서 실제로 든 글자(cmap)만 읽어 `fonts/chars.txt`를 다시 만듦(지어낸 글자 없음, 스크립트는 저장소 밖). 그 뒤 `node --test` → 아래 줄.
- `node --test`(20:30) → `ℹ tests 118 ℹ pass 118 ℹ fail 0`
- B0 통과 — 커밋 "2차: 강산 pH 묽은 농도 Kw 반영" 푸시(20:30). 화면 확인(염산 1e-8 M → 6.98)은 공개 주소에 반영된 뒤 아래 "화면 확인"에 적는다.

### B1 체험 완료 코드

- `app.js` 22행 `const COMPLETION_CODE = '미정';` → `'1004'` (deploy/spec.md 3장 예외 2, 사람이 채팅으로 준 값). `node --test` 118/118.

### B2 흡광도 샘플 (loop2의 F02·F05를 이 코드에 맞춘 것)

- `calc.js`: `SAMPLE`에서 희석을 빼 고체 넷만 남기고, `SAMPLE_ABSORBANCE`(메틸렌 블루, 원액 100 mg/L, 0.5·1·2·4 mg/L 각 50 mL)를 새로 만들어 둘 다 내보냄. `expectedAbsorbance(이름, 희석 결과)`(A = 74000 × mg/L ÷ 1000 ÷ 319.85, 이름에 "메틸렌 블루"가 있을 때만), `stockGuide(단위, 원액 농도, 조제량)`, `ABSORB` 상수, 문구 `TEXT.absorbNote`·`TEXT.absorbOver` 추가.
- `app.js`: `loadSample()`은 고체 넷만 불러오고 희석 탭을 건드리지 않음. `loadAbsorbanceSample()`은 조제 목록을 그대로 두고 희석 탭만 채움. `renderAbsorbance()`가 희석표 아래 `#dil-absorb`에 예상 흡광도 줄을 그림. `#dil-summary` 안 `#dil-guide`에 원액 조제 안내. 1분 체험 3단계가 흡광도 샘플을 불러오고 `#dil-table`을 비춤(문구 "100 mg/L 원액 하나로 4가지 농도(0.5·1·2·4 mg/L)…").
- `index.html`: 머리의 [샘플: 총괄성 실험] 옆에 [샘플: 흡광도 실험](`#btn-sample-abs`), 희석 탭 [행 추가] 옆에 같은 이름 버튼(`#btn-sample-abs-dil`), `#dil-absorb`, `#dil-guide`.
- `style.css`(맨 끝에 덧붙임): 너비 700px 아래에서는 머리의 흡광도 버튼을 숨김. 까닭: 375px·320px에서 새 버튼이 색 점을 가렸다(375px에서 다섯째 점, 320px에서 셋째~다섯째 점이 버튼 밑으로 들어감 — 로컬에서 자리 값을 재서 찾음). 좁은 화면에서는 희석 탭 안의 버튼으로 누른다.
- 고정 사실과의 관계: SPEC 8장의 버튼 이름 [샘플: 총괄성 실험]은 그대로 뒀다. 2장 데모 4단계("원액 1000 mg/L로 4개 농도")는 2차 프롬프트에 따라 "원액 100 mg/L로 4가지 농도"로 바뀐다 → SPEC 27장에 적는다.
- 숫자 재계산(Node): 원액 부피 0.5×50/100 = 0.25, 0.50, 1.00, 2.00 mL, 합 3.75 mL, 3.75×1.1 = 4.125 → 10 mL 플라스크. 흡광도 74000×(c/1000/319.85) = 0.11568, 0.23136, 0.46272, 0.92543 → 0.116 / 0.231 / 0.463 / 0.925. 안내: 100/1000×100 = 10.00 mL. 예전 샘플의 100 mg/L는 23.136(잴 수 없는 범위).
- 고친 테스트와 이유: `tests/calc.test.js` A8(노란 표시가 [true,false,false,false] → [true,true,false,false]: 0.25·0.50 mL 두 줄이 1 mL 미만), A12(희석 카드 제목·단계·합계가 100 mg/L·0.25 mL·3.75 mL로), A13(여덟째 라벨 농도 100 mg/L → 4 mg/L), A16(`SAMPLE.dilution`이 없어지고 `SAMPLE_ABSORBANCE.dilution`으로), `tests/final.test.js` A79(싸고 푸는 희석 값을 흡광도 샘플로). 계산식은 그대로이고 샘플 값만 바뀌어서 기대값을 새 값으로 고쳤다.
- 새 테스트 `tests/absorbance.test.js` 7건: 샘플 둘로 나뉨 / 0.25·0.50·1.00·2.00 mL와 합 3.75 / 흡광도 0.116·0.231·0.463·0.925(±0.002) / 이름 조건과 1.0 초과 경고·경계 / 안내 문구 "10.00 mL" / 버튼·자리·1분 체험 3단계 / 카드 5장·라벨 8장.
- 로컬 화면 확인(`http://localhost:8765`, 20:36~20:40): [샘플: 총괄성 실험] → 조제 목록 넷, 희석 칸은 빈 채. [샘플: 흡광도 실험] → 조제 목록 4행 그대로, 희석표 `0.25 / 0.50 / 1.00 / 2.00 mL`, "예상 흡광도 0.5 mg/L → 0.116 … 4 mg/L → 0.925 ε 7.4×10⁴ L/(mol·cm), 무수물 기준, 1 cm 셀 가정 — 기기마다 다름", "원액 총 사용량 3.75 mL / 권장 원액 조제량 10 mL / 1000 mg/L 원액(시약 0.250 g → 250 mL)을 먼저 만든 뒤 10.00 mL를 100 mL로 묽히기". 용액 이름을 "염화 나트륨"으로 바꾸면 흡광도 줄이 사라짐. 1분 체험 끝까지 → 카드 5장, 라벨 8개, "체험 완료 코드 1004", 인쇄 창 0회. 375px·320px 다섯 화면 가로 스크롤 없음, 콘솔 오류 0.
- `node --test`(B2 뒤) → `ℹ tests 125 ℹ pass 125 ℹ fail 0 `

### B3 기호 (F20)

- 서브에이전트 레인(Opus 5.5 high, 따로 만든 git 워크트리)이 구현하고, 구현하지 않은 검증 에이전트가 다른 워크트리에 패치를 적용해 반박을 시도함: 반박 0건.
- 원인: 실험 목록 카드(`.lab-item__thumb`)와 홈 '오늘의 실험' 카드(`.today-art__mark`)가 단원 기호(`unitMark(unit)`)를 그려서, 수산화 칼슘의 용해도곱 실험(id `ksp`, 단원 '화학 평형') 카드에 K<sub>c</sub>가 보였다.
- 고침(`app.js`만): `LAB_MARKS = { ksp: 'Ksp', conductivity: 'σ' }`, `symbolParts('Ksp')` → `['K', { sub: 'sp' }]`, `labMark(lab)`가 `el('sub')`로 그림(innerHTML 쓰지 않음). 두 카드의 `unitMark(...)`를 `labMark(...)`로 바꿈. 실험 id·제목·검색어·계산은 그대로.
- 검증자의 앞뒤 비교(실험 33개의 카드 기호를 패치 앞뒤로 그려 견줌): 바뀐 것은 둘뿐 — `ksp`: K<sub>c</sub> → K<sub>sp</sub>, `conductivity`: ΔT<sub>f</sub> → σ. 나머지 31개는 그대로.
- [!] 프롬프트는 "표준편차는 σ"라고 했지만, 카드에 표준편차를 `s`나 `SD`로 쓰는 곳이 없다(화면의 표준편차는 한글 "표준 편차"뿐). `loop2/spec.md` 0장은 "F20 전기 전도성 기호 σ"라고 적고 있어서 σ는 전해질의 전기 전도성 실험 카드에 넣었다. 선택지 1(추천, 지금 상태): 전기 전도성 카드에 σ. 선택지 2: `LAB_MARKS`에서 `conductivity: 'σ'` 한 줄과 `tests/symbols.test.js`의 그 단언을 빼면 예전 기호로 돌아간다.
- 새 테스트 `tests/symbols.test.js` 3건(기능을 세 가지로 되돌려 보면 각각 실패하는 것을 검증자가 확인). 패치 적용 때 `core.autocrlf=true` 때문에 `app.js`가 CRLF로 바뀌어 내 테스트 1건이 깨짐 → LF로 되돌려 해결(`sed -i 's/\r$//'`).
- `node --test`(B3 뒤) → `ℹ tests 128 ℹ pass 128 ℹ fail 0 `
