# SPEC — 용액 레시피 메이커 공개 배포 (GitHub Pages)

> 작성: 2026. 11. 17. 원본은 claude.ai 대화의 Claude가 쓴 `deploy/spec.md`·`deploy/prompt.md`이다. 이 컴퓨터(`C:\Users\PC-11\Desktop\랄프톤`)에 맞게 Claude Code가 고쳐 썼다. 사람이 검토해 확정한다.
> 이 문서는 앱의 `SPEC.md`(맨 위)를 대신하지 않는다. **"랄프톤 폴더에 복사해 둔 앱을, 누구나 로그인 없이 여는 공개 주소 하나로 만드는 일"만** 다룬다. 앱의 기능은 바꾸지 않는다.
> 놓을 곳: `랄프톤/deploy-pages/SPEC.md`. 작업 순서는 같은 폴더의 `TASKS.md`.
> 왜 `deploy/`가 아니라 `deploy-pages/`인가: 앱 원본에 `deploy/spec.md`가 있을 수 있는데, 윈도우는 대소문자를 가리지 않아 `spec.md`를 복사하면 이 `SPEC.md`를 덮어쓴다. 그래서 폴더 이름을 따로 쓴다.
> 왜 따로 하나: 배포가 이번 대회의 단일 실패 지점이다. 여기서 막히면 2차 루프가 아무리 잘 돼도 심사·체험 투표에 낼 주소는 공유해 둔 claude.ai 아티팩트(1차 이전 화면)뿐이다. 그래서 2차 루프(`loop2/`)보다 먼저, 따로 끝낸다.

---

## 0. 출발 전 준비 (사람만 할 수 있는 일)

### 0-1. 사람이 채울 값

| 칸 | 적을 값 | 비어 있으면 |
|---|---|---|
| GitHub 아이디 | `ohjuan0204-maker` | (확정) PG1에서 `gh`가 로그인 상태면 `gh api user --jq .login`과 같은지 본다. 다르면 다른 계정으로 로그인한 것이니 멈추고 묻는다. |
| 저장소 이름 | `recipe-maker` | `recipe-maker`. 영문 소문자·숫자·`-`만. 한글·띄어쓰기 금지. 로컬 폴더 이름(`랄프톤`)과는 상관없다. |
| 공개 주소(예상) | `https://ohjuan0204-maker.github.io/recipe-maker/` | 아이디와 저장소 이름으로 저절로 정해진다. |
| 저장소 주소 | `https://github.com/ohjuan0204-maker/recipe-maker.git` | — |
| 커밋에 적을 이름 | `Mol-Loop` | (확정) |
| 커밋에 적을 메일 | `356137520+ohjuan0204-maker@users.noreply.github.com` (GitHub noreply, `gh api user`로 확인) | 사람이 GitHub Settings → Emails에서 복사해 여기 적는다. 비어 있고 `gh`가 로그인 상태면 에이전트가 PG1에서 `gh api user --jq .id`(숫자)와 `gh api user --jq .login`(아이디)을 따로 받아 `<숫자>+<아이디>@users.noreply.github.com`으로 만든다. 둘 다 안 되면 PG5에서 멈추고 묻는다. **개인 메일 주소는 이 문서와 커밋 어디에도 적지 않는다**(이 문서도 공개 저장소에 올라간다). |
| 저장소를 Public으로 해도 되는가 | `예` | (확정) |
| `reagents.js`의 학교 시약 목록 공개를 선생님께 확인했는가 | `생략` (사람이 2차 런 직전에 말함) | `아직`이어도 진행하지만 보고의 "남은 위험"에 적는다. |
| 배포 시작 시각 | `__:__` | 에이전트가 PG1에서 현재 시각으로 채운다. |
| 배포 마감 시각 | `__:__` | 시작 시각 + 45분(원본은 30분. 사람 응답과 반영 대기가 두 번 들어가서 늘림). 비어 있으면 에이전트가 PG1에서 "시작 + 45분"으로 채운다. **PG9가 통과하기 전에** 이 시각이 지나면 계획 B. PG9 통과 뒤에는 마감과 상관없이 끝까지 한다. |
| 체험 완료 코드 | `1004` | 이 배포에서는 바꾸지 않는다. 적어만 둔다(2차 루프 `loop2/spec.md` 0장에 옮긴다). |
| GitHub CLI(`gh`) 로그인 | `함 / 안 함` | `안 함`이면 첫 푸시 때 로그인 창을 사람이 처리하고(PG6), PG7(Pages 켜기)도 사람이 Settings에서 한다. |

### 0-2. 사람이 할 순서 (약 15분)

1. **앱 복사.** 다른 곳에 있는 `recipe-maker/` 폴더의 **내용물**을 `C:\Users\PC-11\Desktop\랄프톤\` 맨 위에 복사한다.
   - 결과: `랄프톤\index.html`, `랄프톤\SPEC.md`, `랄프톤\TASKS.md`, `랄프톤\PROGRESS.md`, `랄프톤\fonts\`, `랄프톤\tests\` …가 바로 보여야 한다. `랄프톤\recipe-maker\index.html`처럼 한 단계 더 들어가면 안 된다.
   - 원본에 `deploy\` 폴더가 있어도 상관없다. 단, **`deploy-pages\` 폴더는 덮어쓰지 않는다**(이 문서가 있는 곳).
   - 원본의 `.git\` 폴더는 **복사하지 않기를 권한다.** 예전 커밋에 들어간 파일(신청서 등)까지 함께 공개되기 때문이다. 기록을 꼭 이어야 하면 복사해도 되고, 그때는 PG2가 과거 기록까지 검사한다.
2. **Git 설치.** PowerShell에서:
   ```
   winget install --id Git.Git -e --source winget
   ```
   설치 화면이 나오면 기본값 그대로 둔다("Git Credential Manager"가 켜져 있어야 한다. 기본값으로 켜져 있다. 첫 푸시 때 로그인 창을 띄워 주는 것이 이것이다).
3. **Node.js 설치** (확인 도구와 앱 테스트 `node --test`에 필요, v18 이상):
   ```
   winget install --id OpenJS.NodeJS.LTS -e --source winget
   ```
4. (**강력 권장**) **GitHub CLI**:
   ```
   winget install --id GitHub.cli -e --source winget
   ```
5. **터미널과 Claude 앱을 모두 껐다 새로 연다.** 새로 열지 않으면 `git`·`node`·`gh`를 못 찾는다. 새 PowerShell에서 `git --version`, `node --version`이 나오는지 본다.
6. (4번을 했으면) 새 PowerShell에서 `gh auth login`(GitHub.com → HTTPS → Login with a web browser) → `gh auth setup-git`. 이렇게 해 두면 **에이전트의 첫 푸시가 로그인 창 없이 끝나고**(무인 실행이 멈추지 않는다) Pages 켜기와 반영 확인도 에이전트가 대신한다. 0-1의 `gh` 칸에 `함`.
7. **빈 저장소 만들기.** 브라우저에서 GitHub에 로그인한 상태로 github.com/new를 연다.
   - Owner: 내 아이디, Repository name: `recipe-maker`, **Public**.
   - "Add a README file", ".gitignore", "license"는 **모두 끈다**(빈 저장소여야 첫 푸시가 거절되지 않는다).
   - Create repository. 화면에 나오는 주소 `https://github.com/<아이디>/recipe-maker.git`을 확인한다.
8. 0-1 표를 채운다(또는 Claude에게 값을 말해 채우게 한다).
9. Claude Code를 **`C:\Users\PC-11\Desktop\랄프톤`** 폴더에서 연다(맨 위에 `index.html`이 있는 폴더). 다른 폴더에서 켠 세션이면 새로 연다.
10. 실행을 시작한다(`ralph-launch` 스킬, 또는 `/goal`):
    `deploy-pages/SPEC.md 14장 끝의 기준을 만족한다(공개 주소에서 check_pages.mjs가 같음 n/n, 데모 1~8단계 통과) 또는 12장 계획 B로 멈춘다. 사람 차례(로그인 창, Pages 켜기, 파일 공개 여부, 사이트 승인)에서는 할 일을 한 문장으로 알리고 턴을 끝내 답을 기다린다.`
11. 에이전트가 부르면 사람이 한다(이 넷 말고는 손대지 않는다):
    - "로그인 창이 떴습니다" → 창(또는 브라우저)에서 GitHub 로그인 → Authorize Git Credential Manager → 채팅에 "끝났어".
    - "Pages를 켜 주세요" → 저장소 Settings → 왼쪽 Pages → Source "Deploy from a branch" → Branch `main`, 폴더 `/ (root)` → Save → 채팅에 "켰어".
    - "이 파일을 커밋해도 되나요" → 학생 이름·학번이 든 문서면 "아니오".
    - 내장 브라우저가 `github.io` 사이트 승인을 물으면 → 허용.

---

## 1. 한 줄 소개

심사위원과 체험 투표 참가자가 **로그인 없이 휴대폰·PC 브라우저에서 바로 여는** '용액 레시피 메이커'의 공개 주소(GitHub Pages)를, 랄프톤 폴더의 앱을 그대로 올려 만든다.

## 2. 데모 시나리오 (배포가 끝났을 때 보여 줄 것)

1. 시크릿 창에서 `https://<아이디 소문자>.github.io/recipe-maker/`를 연다 → 로그인 없이 홈이 뜨고 왼쪽 위에 "용액 레시피 메이커".
2. 앱 `SPEC.md` 2장 데모 시나리오 1~8단계를 그대로 한다(1차 끝 상태의 데모. 2차의 새 단계는 2차 루프에서 본다).
3. 홈의 [1분 체험] → 7단계 → [끝내기] → 홈.
4. `<공개 주소>#solid`, `<공개 주소>#waste`를 바로 열어도 그 화면이 뜬다.
5. 휴대폰 너비(375px)에서 가로 스크롤 없이 같은 화면.

## 3. 범위

- 필수
  - M1 공개해도 되는 파일만 고르기(PG2·PG4)
  - M2 로컬 Git 저장소, 첫 커밋, GitHub로 첫 푸시(PG5·PG6)
  - M3 GitHub Pages 켜기 — `main` 브랜치, `/ (root)`(PG7, 사람 또는 `gh`)
  - M4 확인 도구 `tools/check_pages.mjs`와 공개 주소의 파일 대조(PG3·PG8·PG9)
  - M5 공개 주소에서 깊은 주소·데모·휴대폰 너비·콘솔 확인(PG10~PG12)
  - M6 기록: PROGRESS.md "배포" 절, 앱 SPEC.md 8장, README.md, `loop2/spec.md` 0장(PG14)
- 시간 남으면: 해당 없음(배포 외 일은 하지 않는다).
- 만들지 않음: 앱 기능 바꾸기, 디자인 바꾸기, 새 계산, 2차 루프 항목(F02~F26), GitHub Actions 워크플로 파일, 사용자 정의 도메인, 빌드 도구, 분석·추적 스크립트, 외부 라이브러리·패키지 설치.

### 3-1. 우선순위

| 순위 | 항목 | 이유 |
|---|---|---|
| 0 | 사람 준비물(0장) | 사람만 할 수 있다. 없으면 에이전트가 아무것도 못 한다. |
| 1 | PG1~PG4 공개해도 되는 파일만 커밋 | 한 번 푸시한 것은 공개 기록에 남는다. 학생 이름·학번이 든 문서가 섞이면 되돌리기 어렵다. |
| 2 | PG5~PG7 첫 푸시와 Pages 켜기 | 가장 막히기 쉽다(로그인, 저장소 비공개, 브랜치 이름). |
| 3 | PG8~PG10 공개 주소의 파일 대조 | "뜨긴 뜨는데 화면이 깨짐"(대소문자, 빠진 파일, 캐시)을 잡는다. |
| 4 | PG11~PG12 화면 확인 | 심사·체험 투표에서 실제로 보이는 것. |
| 5 | PG14 기록 | 2차 루프가 공개 주소를 쓸 수 있게. |

## 4. 화면과 동작

앱 화면은 바꾸지 않는다(해당 없음). 이 배포에서 새로 만드는 것은 확인 도구 하나뿐이다.

### `tools/check_pages.mjs` (확인 도구, 사이트 코드 아님)

- 외부 라이브러리 없이 Node 18 이상의 기본 기능(`fetch`, `crypto`, `fs`, `path`, `child_process`)만 쓴다.
- 쓰는 법:
  - `node tools/check_pages.mjs --local` — 커밋·경로만 점검
  - `node tools/check_pages.mjs https://<아이디 소문자>.github.io/recipe-maker/` — 공개 주소 대조
  - 뒤에 `--wait 15`를 붙이면 모두 같아질 때까지 60초마다 다시 본다(최대 15분).
  - `--html <파일>`: `index.html` 대신 이 파일에서 경로를 모은다(그 파일이 저장소 맨 위에 있는 것처럼 경로를 푼다). 도구 자체 점검(PG8)용이다.
- 하는 일:
  1. 저장소 맨 위의 `index.html`에서 `src`/`href`, `fonts/fonts.css`에서 `url()`을 모아 사이트 파일 목록을 만든다(`index.html`, `fonts/fonts.css` 포함, `data:`·`#…`·`mailto:`는 뺀다). `fonts.css` 안의 경로는 `fonts/` 기준으로 풀어 저장소 경로로 바꾼다. PG3에서 스크립트 안의 `fetch('…')`·`new Worker('…')`·`import(…)` 경로를 찾았으면 도구 안 목록에 넣는다.
  2. `--local`: 경로마다 세 조건을 검사하고 문제마다 한 줄 출력한다.
     (1) `/`나 `\`로 시작하지 않고 `\`가 없다. (2) `http://`·`https://`·`//`로 시작하지 않는다. (3) 파일 목록에 **글자 그대로**(대소문자까지) 있다.
     파일 목록 규칙: 저장소이고 `git ls-files` 결과가 비어 있지 않으면 그것을 쓴다. 저장소가 아니거나(`git` 오류) 결과가 비어 있으면(갓 `git init`) 실제 폴더 목록을 쓴다 — 부모 폴더의 `readdirSync` 목록과 글자 그대로 견준다. 윈도우의 `existsSync`는 대소문자를 무시하므로 쓰지 않는다. 출력 첫 줄에 어느 목록을 썼는지 적는다(`목록: git ls-files` / `목록: 폴더`).
     마지막 줄: `경로 n개, 문제 k개`. k가 0이 아니면 종료 코드 1.
  3. 주소가 주어지면 파일마다 `fetch(주소 + 경로, { cache: 'no-store' })` → 상태 코드, `content-type`, 내용의 sha256을 구하고, `git show HEAD:<경로>`의 sha256과 견준다. `git show`는 `execFileSync('git', ['show', 'HEAD:' + 경로], { encoding: 'buffer', maxBuffer: 64*1024*1024 })`로 **바이트 그대로** 받는다(PowerShell 파이프를 거치지 않는다). 주소가 `/`로 끝나지 않으면 붙인다. 경로 안의 글자는 `encodeURI`로 바꿔 붙인다.
  4. 첫 화면(주소 그 자체)의 HTML에 `<title>용액 레시피 메이커</title>`가 있는지 본다. 없으면 실패로 센다.
  5. 결과 줄 예: `200 text/javascript; charset=utf-8  같음  app.js`. 마지막 줄: `파일 n개: 같음 a/n, 다름 b, 404 c, 그 밖 d (커밋 <git rev-parse --short HEAD>)`. a가 n과 같고 제목 검사가 통과해야 종료 코드 0, 아니면 1. (내용 sha256이 커밋과 모두 같다는 것이 "공개 주소가 이 커밋을 내보낸다"는 증거다. 커밋 해시는 기록용이다.)
  6. `--wait N`: 다 같지 않으면 60초 기다렸다 다시 본다. N분이 지나면 마지막 결과로 끝낸다. **같은 요청을 1분보다 짧은 간격으로 되풀이하지 않는다.** 셸 도구의 한 번 실행 한도가 10분이므로 `--wait`는 **항상 백그라운드로** 돌리고 끝 알림을 기다린다.
- 내용 종류 기대값: `.html` text/html, `.js` text/javascript 또는 application/javascript, `.css` text/css, `.woff2` font/woff2, `.woff` font/woff, `.txt` text/plain. 다르면 `경고` 줄만 찍는다(실패로 보지 않는다).
- 출력은 UTF-8이다. PowerShell 5.1에서 한글이 깨지면 실행 전에 `[Console]::OutputEncoding = [Text.Encoding]::UTF8`.
- 비었을 때·오류일 때: `index.html`이 없으면 `index.html 없음 — 랄프톤 폴더 맨 위에서 실행하세요`를 찍고 종료 코드 2. `git`이 없으면 `git을 찾을 수 없음`, 종료 코드 2. 네트워크 오류는 그 파일을 `그 밖`으로 세고 오류 글자를 한 줄 찍는다.

## 5. 데이터

- 사이트 파일: 앱 원본 그대로(아래 8장). 새 데이터는 없다.
- 기록 위치: 맨 위 `PROGRESS.md` 끝의 `## 배포 (GitHub Pages)` 절. 항목마다 `PGn 통과|실패 — <실제 명령 출력 한 줄 또는 화면에서 본 글자>`.
- 비밀값: 없다. 비밀번호·토큰·인증 코드는 어디에도 적지 않는다.

## 6. 기술 결정

- 구성: 빌드 없는 정적 웹앱. 폴더 그대로가 사이트다. npm 설치·번들러·프레임워크 없음.
- 작업 폴더: `C:\Users\PC-11\Desktop\랄프톤` (저장소의 맨 위 = 이 폴더). 끝까지 옮기지 않는다.
- 폴더 구조(복사 뒤 예상):
  ```
  랄프톤/
    index.html  style.css  reagents.js calc.js labcalc.js experiments.js theory.js search.js
    curve.js share.js waste.js filein.js plan.js error.js topics.js app.js
    fonts/ (fonts.css, woff2·woff 각 6개, LICENSE.txt)
    tests/  tools/  SPEC.md  TASKS.md  PROGRESS.md  README.md  (loop2/)
    deploy-pages/ SPEC.md TASKS.md      ← 이 문서
    .nojekyll  .gitignore               ← PG4에서 만든다
  ```
  1차 루프에서 파일이 늘었을 수 있으니 PG3에서 `index.html`을 직접 읽어 목록을 다시 만든다.
- 도구: Git(Credential Manager 포함), Node.js 18 이상, (선택) GitHub CLI `gh`. 모두 0장에서 사람이 설치한다. 에이전트는 설치하지 않는다.
- 셸: Windows PowerShell 5.1. `&&` 대신 `;`와 `if ($?) {…}`, `wc -l` 대신 `(git ls-files).Count`. 한글 파일 이름이 `"\355\..."`처럼 보이면 `git config core.quotepath false`(이 저장소에만).
- 파일 쓰기: `.gitignore`, `PROGRESS.md`, `README.md`, `tools/check_pages.mjs` 등 글 파일은 **Write/Edit 도구로만** 쓴다(UTF-8). PowerShell의 `>`·`Out-File`·`Set-Content`·`Add-Content`로 쓰지 않는다(5.1에서 UTF-16·CP949가 섞여 Git이 `.gitignore`를 못 읽는다). 예외: 빈 `.nojekyll`은 `New-Item`.
- 멈춤 방지: 편집기를 여는 Git 명령을 쓰지 않는다(커밋은 항상 `-m`, `--amend`는 `--no-edit`, `pull`·`merge`는 `--no-edit`). Git 명령 전에 `$env:GIT_TERMINAL_PROMPT='0'`을 둬서 터미널이 글자로 아이디를 묻는 대신 바로 실패하게 한다.
- 화면 확인: Claude 데스크톱 앱의 내장 브라우저(미리보기 창, `mcp__Claude_Browser__*`)로 공개 주소를 연다. 너비는 `resize_window`, 콘솔은 `read_console_messages`, 네트워크는 `read_network_requests`, 가로 스크롤은 `javascript_tool`로 `document.documentElement.scrollWidth <= innerWidth`. 처음 열 때 사이트 승인을 물으면 사람 차례다. 데모 중 내장 브라우저로 할 수 없는 동작(내 컴퓨터 파일 고르기, 클립보드 붙여넣기, 인쇄)은 그 단계만 `[-] 자동 불가 — <사유>`로 적고 PG13(사람 확인) 목록에 넘긴다. 그 단계 앞뒤의 나머지는 계속한다.
- 서브에이전트: 쓸 때는 **항상 Opus 5.5(`model: "opus"`), `effort: "high"`**. fork 타입은 모델을 바꿀 수 없으니 쓰지 않는다.
- 실행 방법: 해당 없음(사이트는 공개 주소에서 연다).
- 전체 검증: `node tools/check_pages.mjs <공개 주소>` (종료 코드 0, `같음 n/n`) + `node --test` (PG1과 같은 건수 통과) + 7장 PG10~PG12의 미리보기 점검.
- 출발 전 준비(사람이 할 일): 0장 전체.

## 7. 수용 기준

번호는 PG1~PG14(Pages)다. 앱 SPEC.md의 A18(공개 주소)을 PG8·PG11로 확인한다.

| ID | 기준 (하면 → 된다) | 확인 방법 | 관련 |
|----|--------------------|-----------|------|
| PG1 | 시작 상태를 재면 → 도구가 있고 앱 테스트가 통과한다 | 아래 7-1 PG1의 다섯 명령 출력 | 준비 |
| PG2 | 공개 점검을 하면 → 공개하면 안 되는 파일이 커밋 대상에 없다 | 검색 결과 수와 처리 내역 | M1 |
| PG3 | 경로를 점검하면 → 모든 참조가 상대 경로이고 대소문자까지 실제 파일과 같다 | `node tools/check_pages.mjs --local` → `문제 0개` | M4 |
| PG4 | `.nojekyll`·`.gitignore`를 두면 → 사이트 파일이 무시되지 않는다 | `git status --short --ignored`에 사이트 파일 `!!` 없음 | M1 |
| PG5 | 첫 커밋을 하면 → `main`에 사이트 파일이 모두 들어간다 | `git log --oneline -1`, `(git ls-files).Count` | M2 |
| PG6 | 첫 푸시를 하면 → 두 번째 푸시가 묻지 않고 끝난다 | `git push` → `Everything up-to-date` | M2 |
| PG7 | Pages를 켜면 → 사이트 주소가 생긴다 | Settings → Pages "Your site is live at …" 또는 `gh api repos/<아이디>/recipe-maker/pages`의 `html_url` | M3 |
| PG8 | 확인 도구를 돌리면 → 일부러 넣은 없는 경로를 잡는다 | 임시 HTML로 돌려 그 경로가 `없음`으로 나옴, 임시 파일 지움 | M4 |
| PG9 | 반영을 기다리면 → 공개 주소의 모든 파일이 커밋과 같다 | `check_pages.mjs <주소> --wait 15`(백그라운드) → `같음 n/n`, 종료 코드 0. 그리고 `git fetch origin` 뒤 `git rev-parse HEAD` = `git rev-parse origin/main` | M4 |
| PG10 | 깊은 주소로 열면 → 그 화면이 뜬다 | `#solid`, `#waste`, 끝 `/` 없는 주소 | M5 |
| PG11 | 공개 주소에서 데모를 하면 → 1~8단계와 1분 체험이 통과한다 (A18) | 단계마다 화면에 보인 글자 | M5 |
| PG12 | 375px·320px로 보면 → 가로 스크롤 없음, 콘솔 오류 0, 404 0 | `scrollWidth <= innerWidth`, 콘솔·네트워크 목록 | M5 |
| PG13 | (사람) 휴대폰으로 열면 → 모바일 데이터·학교 와이파이에서 열린다 | 사람이 말해 준 "기기·망·결과" | 에이전트 끝 기준에서 뺌 |
| PG14 | 기록하면 → 공개 주소가 7-1 PG14의 "기록할 곳" 중 있는 곳 모두에 같은 글자로 있고, 다시 대조해도 같다 | 그 파일들에서 주소 grep, `check_pages.mjs` 같음 n/n | M6 |

### 7-1. PG별 세부 절차

#### PG1 시작 상태 — 폴더와 도구

- 지금 폴더가 `C:\Users\PC-11\Desktop\랄프톤`이고 맨 위에 `index.html`, `SPEC.md`, `TASKS.md`, `deploy-pages\SPEC.md`가 있다. `index.html`이 없으면(앱을 아직 복사하지 않았으면) 멈추고 사람에게 0-2의 1번을 부탁한다.
- `git --version` → `git version 2.`로 시작. 없으면 멈추고 사람에게 설치를 부탁한다(11장).
- `node --version` → v18 이상.
- `node --test` 전체 통과. 건수를 적는다(1차 끝 기준 148건으로 알려져 있으나 그대로 믿지 않고 실제 건수를 적는다).
- `tools/check_mw.mjs`가 있으면 `node tools/check_mw.mjs reagents.js` 오류 0. 없으면 "없음".
- `PROGRESS.md`가 없으면 만든다. 맨 끝에 `## 배포 (GitHub Pages)` 절을 만들고 위 다섯 줄의 실제 출력을 한 줄씩 적는다.
- 0-1의 시작 시각을 지금 시각으로, 마감 시각이 비어 있으면 시작 + 45분으로 채운다.
- 0-1의 커밋 메일이 비어 있으면: `gh auth status`가 로그인 상태면 0-1 표의 `gh api user` 명령으로 채운다(Write/Edit 도구로). 아니면 PG5까지 기다렸다가 묻는다.
- `gh`가 로그인 상태면 `gh api user --jq .login`이 `ohjuan0204-maker`인지 본다. 다르면 멈추고 묻는다.
- 0-1의 Public이 `아니오`면 여기서 바로 계획 B(12장)로 간다.

#### PG2 공개하면 안 되는 파일 거르기

- 폴더 전체(하위 포함, `.git\` 제외)에서 `.hwp`, `.hwpx`, `.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`, `.zip`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.env`, `*.key`, `*.pem`을 찾는다.
  - 남기는 것(묻지 않음): `tests/fixtures/`의 시험용 파일(지어낸 값, README에 그렇게 적힘), 그리고 사이트가 실제로 부르는 파일(`index.html`·`fonts/fonts.css`·스크립트가 경로로 부르는 이미지 등, PG3 목록).
  - 나머지는 모두 목록으로 사람에게 "커밋해도 되나요"라고 묻는다. 대회 참가 신청서처럼 **학생 이름·학번**이 들어 있을 수 있는 문서는 커밋하지 않는다.
  - 사람이 "아니오"라고 한 파일은 **에이전트가 `.gitignore`에 넣는다**(PG4). 지우거나 옮기지 않는다. 답을 받을 때까지 PG5로 넘어가지 않는다.
- 원본 `.git`을 가져왔으면(`.git` 폴더가 이미 있으면) 과거 기록도 같은 기준으로 본다: `git log --all --name-only --format=""`에서 위 확장자를 찾는다. 사이트·fixtures 밖의 문서가 과거 커밋에 있으면 **푸시하지 않고 멈춘 뒤** 사람에게 알린다("과거 기록에 X가 있습니다. `.git` 폴더를 폴더 밖으로 옮기고 새로 시작해도 될까요?"). 사람이 옮기면 PG5는 `git init -b main`부터 한다.
- 글 파일(`*.md`, `*.js`, `*.mjs`, `*.html`, `*.css`, `*.json`, `*.txt`)에서 열쇠처럼 보이는 글자를 찾는다: `sk-`, `AKIA`, `ghp_`, `github_pat_`, `api_key`, `apikey`, `password`, `token=`. 나오면 무엇인지 확인하고, 진짜 비밀이면 커밋하지 않는다.
- 학번처럼 보이는 숫자 묶음(예: 다섯 자리 숫자 옆에 사람 이름)이 글 파일에 있는지 본다. 있으면 사람에게 확인한다.
- `deploy-pages/` 문서도 공개된다. 여기에는 GitHub 아이디, noreply 메일 말고 개인 정보를 적지 않는다.
- 확인: PROGRESS.md에 "공개 점검: 문서 파일 n개(시험용 m개는 남김), 걸린 것 k개 → 처리"를 적는다.

#### PG3 경로 점검 — 하위 주소와 대소문자

GitHub Pages는 리눅스처럼 **대소문자를 가린다.** 윈도우에서는 `Reagents.js`와 `reagents.js`가 같은 파일로 열리지만 공개 주소에서는 404다. 또 공개 주소는 하위 주소(`/recipe-maker/`)라 `/`로 시작하는 경로는 깨진다.

- `index.html`의 모든 `src="…"`, `href="…"`와 `fonts/fonts.css`의 모든 `url(…)`을 모은다(`data:`, `#…`, `mailto:`는 뺀다).
- 4장 도구의 세 조건을 본다.
- app.js 등 스크립트 안에서 부르는 파일 경로(`fetch('…')`, `new Worker('…')`, `import(…)`)를 grep으로 찾는다. 있으면 도구 목록에 넣고, 없으면 "없음"이라고 적는다.
- 파일 이름에 한글·띄어쓰기가 있는 파일을 사이트가 부르지 않는지 본다.
- 문제가 있으면 8장의 유일한 예외(참조 쪽 대소문자를 실제 파일 이름에 맞추기)만 한다. 그 뒤 `node --test` 전체 통과를 다시 보고 PROGRESS에 이유를 적는다.
- 확인: `node tools/check_pages.mjs --local` 출력 `경로 n개, 문제 0개`. (커밋 전이면 실제 폴더 목록으로, PG5 뒤에 `git ls-files`로 한 번 더.)

#### PG4 `.nojekyll`과 `.gitignore`

- 맨 위에 빈 파일 `.nojekyll`을 만든다(`if (-not (Test-Path .nojekyll)) { New-Item -ItemType File .nojekyll }`). GitHub Pages가 Jekyll로 폴더를 가공하지 않고 그대로 내보내게 한다.
- `.gitignore`가 있으면 사이트에 필요한 파일(`*.js`, `*.css`, `fonts/*`, `index.html`)을 빼 버리지 않는지 `git check-ignore -v <파일>`로 본다(저장소가 아직 없으면 PG5의 `git init` 뒤에 본다). 걸리면 그 줄을 고친다.
- `.gitignore`에 넣을 것: `node_modules/`, `.DS_Store`, `Thumbs.db`, `desktop.ini`, `*.log`, `.claude/`, PG2에서 사람이 빼기로 한 파일.
- 확인: `git status --short --ignored`에 사이트 파일이 `!!`(무시됨)로 나오지 않는다.

#### PG5 첫 커밋

- 저장소가 아니면 `git init -b main`. 이미 저장소인데 브랜치가 `master`면 `git branch -M main`.
- 이 저장소에만: `git config core.quotepath false`.
- `git config user.name`, `git config user.email`은 **언제나** 0-1 값으로 이 저장소에만 설정한다(전역에 실명·학교 메일이 있어도 공개 기록에 남지 않게. `--global`은 건드리지 않는다). 0-1 값이 비어 있으면 멈추고 묻는다.
- 윈도우 줄 끝: `git config core.autocrlf`가 무엇이든 그대로 둔다. 대조(PG9)는 작업 폴더 파일이 아니라 커밋된 내용(`git show HEAD:<경로>`)으로 한다.
- `git add -A` → `git status --short`로 올라갈 파일 수를 세고 PG2에서 걸러야 할 것이 없는지 한 번 더 본다 → `git commit -m "배포 PG5: 1차 루프 끝 상태"`. (원본 `.git`을 가져와 이미 커밋이 있으면 바뀐 것만 같은 메시지로 커밋한다. 바뀐 것이 없으면 커밋하지 않는다.)
- 그 뒤 `node tools/check_pages.mjs --local`을 다시 돌린다(이제 `git ls-files` 기준) → `문제 0개`.
- 확인: `git log --oneline -1`, `(git ls-files).Count`를 PROGRESS에 적는다.

#### PG6 첫 푸시 (사람이 로그인 창을 끝낸다)

- `git remote -v`가 비어 있으면 `git remote add origin https://github.com/<아이디>/recipe-maker.git`. 다른 주소가 있으면 `git remote set-url origin …`.
- 푸시 방법은 로그인 준비 상태에 따라 둘 중 하나다.
  - **`gh auth status`가 로그인 상태**(0-2의 6번을 함): `$env:GIT_TERMINAL_PROMPT='0'; git push -u origin main`을 그냥 실행한다. 로그인 창이 뜨지 않는다.
  - **아니면**: 푸시하기 **전에** 사람에게 먼저 알린다: "곧 GitHub 로그인 창이 뜹니다. 창(또는 브라우저)에서 로그인 → Authorize를 눌러 주세요." 그다음 `$env:GIT_TERMINAL_PROMPT='0'; git push -u origin main`을 **백그라운드로** 실행하고 끝 알림을 기다린다(포그라운드로 돌리면 도구가 붙잡혀 알림이 사람에게 닿지 않는다). 10분이 지나도 안 끝나면 그 작업을 멈추고 사람에게 묻는다.
- 아이디·비밀번호·토큰을 에이전트가 입력하거나 요청하지 않는다.
- `could not read Username`·`terminal prompts disabled`로 실패하면(로그인 창을 띄울 Credential Manager가 없음) 멈추고 사람에게 11장의 방법(`gh auth login` 후 `gh auth setup-git`)을 부탁한다.
- 거절되면 11장 표를 따른다. 강제 푸시는 하지 않는다.
- 확인: 두 번째 `git push` → `Everything up-to-date`, 아무것도 묻지 않는다.

#### PG7 Pages 켜기 (사람, 또는 `gh`)

- `gh`가 있고 `gh auth status`가 로그인 상태면 에이전트가 켠다: `gh api -X POST repos/<아이디>/recipe-maker/pages -f "source[branch]=main" -f "source[path]=/"`. 이미 켜져 있다는 오류(409)면 그대로 진행한다. `gh`가 없으면 설치하지 말고 사람에게 부탁한다.
- 사람에게 부탁할 때: "저장소 Settings → 왼쪽 Pages → Build and deployment의 Source를 'Deploy from a branch'로, Branch를 `main`, 폴더를 `/ (root)`로 고르고 Save를 눌러 주세요."
- Settings → Pages 화면에 "Upgrade or make this repository public"이 보인다고 하면 저장소가 Private이다. 0-1 Public이 `예`면 사람에게 Settings → General 맨 아래 Danger Zone → Change visibility → Public을 부탁한다. `아니오`면 계획 B. 에이전트는 공개 범위를 바꾸지 않는다.
- 확인: "Your site is live at https://…"(반영 중이면 "Your site is ready to be published")를 사람이 알려 주거나, `gh api repos/<아이디>/recipe-maker/pages`의 `html_url`.

#### PG8 확인 도구 `tools/check_pages.mjs`

- 4장대로 만든다. 사이트 코드가 아니라 확인 도구라서 `tools/`에 둔다.
- 확인(이 단계에서는 도구 자체 점검만. 실제 사이트의 `문제 0개`는 PG3·PG5에서 본다): 도구가 실제로 잡는지 한 번 본다: 임시 파일 `tools/_tmp_check.html`에 일부러 틀린 경로 둘(`<script src="App.js"></script>` — 대소문자만 다름, `<link rel="stylesheet" href="/style.css">` — `/`로 시작)을 넣고 `node tools/check_pages.mjs --local --html tools/_tmp_check.html` → 두 경로가 모두 문제로 나오고 종료 코드 1. 임시 파일은 지우고 커밋하지 않는다.

#### PG9 공개 주소 반영 기다리기

- Pages를 켠 뒤 첫 반영은 보통 1~3분, 길면 10분 걸린다. 저장소 Actions 탭의 `pages build and deployment`가 초록이면 반영된 것이다(`gh`가 있으면 `gh run list --limit 3`).
- `node tools/check_pages.mjs <공개 주소> --wait 15`를 **백그라운드로** 돌리고 끝 알림을 기다린다(셸 도구의 한 번 실행 한도는 10분).
- 그 뒤 `git fetch origin` → `git rev-parse HEAD`와 `git rev-parse origin/main`이 같은지 본다(푸시가 빠지지 않았다는 확인).
- GitHub Pages는 파일을 약 10분 동안 캐시한다(`Cache-Control: max-age=600`). 새 커밋 뒤 예전 내용이 보이면 기다린다. 브라우저 확인은 캐시 없이(강력 새로 고침) 한다.
- 확인: `파일 n개: 같음 n/n`, 종료 코드 0, `HEAD` = `origin/main`.

#### PG10 깊은 주소와 새로 고침

- 앱은 화면을 `#solid`, `#dilution`, `#recipe`, `#waste`처럼 `#` 뒤 글자로 바꾼다. 서버 쪽 경로가 아니므로 Pages에서 404가 나지 않아야 한다.
- 확인: 내장 브라우저에서 `<공개 주소>#solid`, `<공개 주소>#waste`를 바로 열면 그 화면이 뜬다. 끝의 `/` 없이 `https://<아이디 소문자>.github.io/recipe-maker`를 열면 GitHub가 `/`를 붙인 주소로 옮겨 주고 화면이 깨지지 않는다(`location.href`가 `/`로 끝남, `style.css` 적용됨).

#### PG11 공개 주소에서 데모 1~8단계 (A18)

- 내장 브라우저로 공개 주소를 연다. 로그인 없이 열려야 한다.
- 앱 SPEC.md 2장 데모 시나리오 1~8단계를 그대로 한다. 단계마다 화면에 보여야 할 글자를 확인한다.
- 1분 체험: 홈의 [1분 체험] → 7단계 → [끝내기] → 홈.
- 라벨은 화면 미리보기까지만 본다. **브라우저 인쇄 창을 띄우지 않는다.**
- 글꼴: 네트워크 목록에 `fonts/hangul-400.woff2`(실제 파일 이름은 `fonts.css`에서 확인)가 200으로 온다.
- 확인: PROGRESS에 단계별 "통과/실패 + 본 글자" 한 줄씩. A18은 앱 SPEC.md 7장 문구 그대로 통과를 적는다.

#### PG12 휴대폰 너비와 콘솔

- 너비 375px와 320px에서 홈, 용액 조제, 희석, 레시피, 폐액 화면의 가로 스크롤이 없다(`document.documentElement.scrollWidth <= innerWidth`).
- 콘솔 오류 0개(경고는 적어만 둔다). 네트워크 404 0개(`favicon.ico` 요청이 있으면 그것도 0개여야 한다. 앱은 `href="data:,"`로 파비콘 요청을 막아 두었다).
- 끝나면 내장 브라우저 너비를 `desktop`으로 되돌린다.
- 확인: PROGRESS에 너비별 결과와 콘솔·404 개수.

#### PG13 다른 기기 (사람)

- 사람이 자기 휴대폰으로 공개 주소를 연다. **모바일 데이터와 학교 와이파이 둘 다.** 학교 망이 `github.io`를 막는 경우가 있다. 막히면 체험 투표 안내에 "모바일 데이터로 열어 주세요"를 넣거나 계획 B의 아티팩트 주소를 함께 적는다.
- 아이폰 사파리, 안드로이드 크롬에서 [1분 체험] 1~2단계까지 눌러 본다.
- 확인: 사람이 결과를 말해 주면 에이전트가 PROGRESS에 "기기·망·결과" 한 줄씩 받아 적는다. 에이전트는 기다리지 않는다.

#### PG14 기록과 다음 단계 연결

- 기록할 곳(공개 주소를 같은 글자로, 끝의 `/`까지). 파일이 없거나 그 칸이 없으면 PROGRESS에 "없음"이라고 적고 넘어간다.
  1. `PROGRESS.md` "배포" 절: 공개 주소, 커밋 해시, PG1~PG13 결과, 걸린 시간, 막힌 것과 푼 방법.
  2. 이 문서 `deploy-pages/SPEC.md` 0-1의 공개 주소 칸(예상 → 실제).
  3. 앱 `SPEC.md` 8장(고정 사실)의 공개 주소 줄(지금 "미정"이면). 10장 제출 요건에 주소 칸이 있으면 거기도.
  4. `README.md` 맨 위 가까이에 `공개 주소: https://…` 한 줄.
  5. `loop2/spec.md` 0장 공개 주소 칸과 "시크릿 창에서 열어 본 시각" 칸(PG10에서 처음 연 시각).
- 앱 TASKS.md에 배포 줄(예: "공개 배포 (GitHub Pages)", T번호는 실제 파일에서 찾는다)이 있으면 [x]. 사람이 할 일로 남은 줄(PG13)은 그대로 둔다.
- 이 폴더의 `deploy-pages/TASKS.md` 표시도 맞춘다.
- 커밋 `배포 PG14: 공개 주소 기록` → 푸시 → `check_pages.mjs <주소> --wait 15`가 다시 `같음 n/n`이 될 때까지 확인.

## 8. 고정 사실 (이 배포에서 바꾸지 않는다)

| 항목 | 값 |
|---|---|
| 작품명 | 용액 레시피 메이커 (`<title>용액 레시피 메이커</title>`, 홈 왼쪽 위에도 같은 글자) |
| 대회 | 2026 루프랩 랄프톤 출품작 |
| 로컬 작업 폴더 | `C:\Users\PC-11\Desktop\랄프톤` (원본 문서의 `recipe-maker/`를 대신한다) |
| 저장소 | `https://github.com/<아이디>/recipe-maker` (0-1) |
| 공개 주소 | `https://<아이디 소문자>.github.io/recipe-maker/` — 끝의 `/`까지 포함 |
| 브랜치 | `main` 하나. 다른 브랜치를 만들지 않는다. |
| Pages 설정 | Source "Deploy from a branch", Branch `main`, 폴더 `/ (root)` |
| 사이트의 첫 파일 | 저장소 맨 위의 `index.html` (랄프톤 폴더 안의 내용이 저장소의 맨 위가 된다. 폴더째 한 단계 더 넣지 않는다) |
| 앱 구성(1차 끝 기준) | `index.html` + 일반 `<script>` 14개(`reagents.js`, `calc.js`, `labcalc.js`, `experiments.js`, `theory.js`, `search.js`, `curve.js`, `share.js`, `waste.js`, `filein.js`, `plan.js`, `error.js`, `topics.js`, `app.js`) + `style.css` + `fonts/`(fonts.css, woff2·woff 각 6개, LICENSE.txt). 빌드 단계 없음. |
| 경로 | 모두 상대 경로, 외부 주소(CDN, 글꼴 서버, API) 없음(앱 SPEC 6장). 로컬 하위 주소(`http://localhost:8765/recipe-maker/`) 확인에서 통과한 적 있음. |
| 크기 | `.git` 빼고 약 3.5 MB(글꼴 약 2 MB). GitHub 파일당 한도(100 MB)·Pages 한도(1 GB)에 한참 못 미침. |
| 앱 코드 | 바꾸지 않는다. **유일한 예외**: PG3에서 참조 경로의 대·소문자가 실제 파일과 다를 때 참조 쪽을 실제 파일 이름에 맞추는 것. 그때도 `node --test`가 통과해야 하고 PROGRESS에 적는다. |
| 강제 푸시 | 하지 않는다(`--force`, `-f` 금지). |
| 기존 아티팩트 | `https://claude.ai/artifact/Mob8rSJwr9iFMWcneU4yue` — 1차 이전 화면. 배포가 끝나면 심사·체험 투표 주소를 GitHub Pages 주소로 바꾼다(사람). |
| 체험 투표 | 11. 18. |

## 9. 가정 (틀렸으면 여기를 고친다)

- 랄프톤 폴더가 저장소의 맨 위다. 앱 원본 `recipe-maker/`의 내용물을 사람이 여기에 복사한다(0-2의 1번).
- 로컬 폴더 이름에 한글(`랄프톤`)이 있어도 저장소 이름·공개 주소에는 영향이 없다.
- 이 문서는 `deploy-pages/`에 둔다(원본 `deploy/spec.md`와 이름 충돌을 피하려고). 저장소에 함께 커밋되어 공개된다.
- Git·Node.js·(선택) GitHub CLI는 출발 전에 사람이 winget으로 설치한다. 2026-11-17 확인 당시 이 컴퓨터에는 셋 다 없었고 Python 3.12/3.14와 winget만 있었다.
- 원본의 "미리보기 도구(1차 루프에서 쓴 것)"는 이 컴퓨터에서 Claude 데스크톱 앱의 내장 브라우저로 대신한다.
- 0-1의 마감 시각이 비어 있으면 PG1 시작 시각 + 45분(원본 30분에서 늘림). 마감은 PG9 통과 전까지만 적용한다(계획 B는 "주소가 안 뜰 때"의 대책이므로).
- 원본 `.git`은 복사하지 않는 것을 기본으로 본다(과거 기록 공개 방지).
- 데모 단계 중 내장 브라우저로 자동화할 수 없는 동작은 그 단계만 PG13(사람 확인)으로 넘긴다.
- 서브에이전트는 Opus 5.5, effort high로만 쓴다(사용자 지시).

## 10. 제출 요건

- 배포 마감: 0-1의 마감 시각(시작 + 45분). PG9 통과 전에 지나면 계획 B.
- 제출물: 공개 주소 하나(로그인 없이 열림). 심사 제출란·패들렛·체험 투표 안내의 주소 교체는 사람이 한다.
- 저장소 공개 여부: Public(0-1이 `예`일 때). `reagents.js`의 학교 시약 목록이 함께 공개된다.
- 체험 투표: 11. 18. 전까지 공개 주소가 떠 있어야 한다.

## 11. 막혔을 때

| 보이는 것 | 까닭 | 할 일 (누가) |
|---|---|---|
| `git`/`node`를 찾을 수 없음 (`The term 'git' is not recognized…`) | 설치하지 않았거나, 설치 뒤 터미널·Claude를 새로 열지 않음 | 사람: 0-2의 2·3번 → 터미널과 Claude를 새로 연다. 에이전트는 설치하지 않는다 |
| `index.html` 없음 | 앱을 아직 복사하지 않았거나 한 단계 더 들어감 | 사람: 0-2의 1번 |
| `Author identity unknown` | 커밋 이름·메일이 없음 | 에이전트: 0-1 값으로 `git config user.name/email`(이 저장소만) |
| `src refspec main does not match any` | 커밋이 없거나 브랜치가 `master` | 에이전트: 커밋 확인, `git branch -M main` |
| 로그인 창이 안 뜨고 터미널이 Username을 물음 | Git Credential Manager가 없음 | 사람: `winget install --id GitHub.cli -e --source winget` → `gh auth login`(GitHub.com, HTTPS, 브라우저 로그인) → `gh auth setup-git`. 에이전트는 비밀번호·토큰을 받지 않는다 |
| `remote: Repository not found` | 주소 오타, 다른 계정으로 로그인, 저장소가 없음 | 사람: 저장소 주소와 로그인한 계정 확인. 에이전트: `git remote set-url origin …` |
| `! [rejected] main -> main (fetch first)` | 저장소를 만들 때 README·라이선스를 넣어 비어 있지 않음 | 에이전트: `git pull --no-rebase origin main --allow-unrelated-histories --no-edit` → 충돌이 README.md뿐이면 `git checkout --ours README.md; git add README.md; git commit -m "배포: 원격 첫 커밋 합치기"` → 푸시. 다른 파일이 충돌하면 멈추고 묻는다. 강제 푸시 금지 |
| `remote: error: File … is 1xx MB; this exceeds GitHub's file size limit` | 큰 파일(zip, 동영상) | 에이전트: 그 파일을 `.gitignore`에 넣고 `git rm --cached <파일>` → `git commit --amend --no-edit`(아직 푸시 전이므로) |
| `could not read Username` / `terminal prompts disabled` | 로그인 창을 띄울 Credential Manager가 없음 | 사람: 아래 줄의 `gh` 방법 |
| Pages 설정에 "Upgrade or make this repository public" | 저장소가 Private | 사람: Public으로(0-1 `예`일 때). `아니오`면 계획 B |
| 공개 주소가 "404 There isn't a GitHub Pages site here" | Pages를 안 켰거나, 브랜치·폴더가 다르거나, 아직 반영 중 | 사람: Settings → Pages 다시 확인(main, /root). 에이전트: Actions 탭 상태, 10분까지 기다림 |
| Actions의 pages build가 빨강 | Jekyll 처리 실패 | 에이전트: `.nojekyll` 있는지(PG4), 커밋·푸시 |
| 화면이 뜨는데 글자만 있고 모양이 없음 / 빈 화면 | `style.css`나 스크립트 404(대소문자, `/`로 시작하는 경로) | 에이전트: `check_pages.mjs`의 404 줄 → 참조를 실제 파일 이름에 맞춤(8장 예외) |
| 한글 글꼴만 다름 | `fonts/` 파일 404 또는 `fonts.css`의 `url()` 대소문자 | 에이전트: 같은 방법 |
| 고쳤는데 예전 화면 | Pages 캐시(약 10분)나 브라우저 캐시 | 기다림, 강력 새로 고침, `check_pages.mjs --wait` |
| 휴대폰에서 학교 와이파이로만 안 열림 | 학교 망 차단 | 사람: 모바일 데이터로 안내, 계획 B 주소 함께 |
| `LF will be replaced by CRLF` 경고 | 윈도우 줄 끝 변환 | 무시해도 된다. 대조는 커밋 내용으로 한다(PG9) |
| 출력의 한글이 깨짐 | PowerShell 5.1 콘솔 인코딩 | `[Console]::OutputEncoding = [Text.Encoding]::UTF8` 뒤 다시 실행 |
| 한글 파일 이름이 `"\355\…"`로 보임 | Git 경로 인용 | `git config core.quotepath false` |

표에 없으면 오류 글자 그대로, 해 본 것과 함께 PROGRESS에 적고 사람에게 묻는다. **같은 방법을 세 번 넘게 되풀이하지 않는다.** 세 번 실패하면 멈추고 묻는다.

## 12. 계획 B (배포 마감 시각까지 공개 주소가 안 뜰 때, 또는 Public이 `아니오`일 때)

- 에이전트: 그 자리에서 멈추고 PROGRESS에 막힌 단계, 마지막 오류 글자, 해 본 것을 적는다. 커밋은 남긴다(나중에 푸시만 하면 된다).
- 사람: 이 폴더를 zip으로 묶어(`.git` 빼도 된다) claude.ai 대화에 올리고 "아티팩트에 올려 줘"라고 한다. 공유해 둔 아티팩트 링크(`https://claude.ai/artifact/Mob8rSJwr9iFMWcneU4yue`)가 이 폴더의 내용으로 바뀐다. 이 링크를 심사·체험 투표 주소로 쓴다.
- `loop2/spec.md`가 있으면 0장 공개 주소 칸에 `계획 B`라고 적는다. 2차 루프는 A18을 [!]로 두고 나머지를 한다.
- 배포는 2차 루프가 끝난 뒤나 다음 날(체험 투표 11. 18. 전) 다시 시도할 수 있다. 그때는 PG1부터 다시 한다.

## 13. 지킬 것

- 앱 기능·디자인·계산을 바꾸지 않는다(8장 예외만). 고정 사실은 바꾸지 않는다.
- 외부 API·라이브러리·글꼴·분석 스크립트를 넣지 않는다(앱 SPEC 6장). 확인 도구도 Node 기본 기능만.
- 프로그램(Git, Node, gh, npm 패키지 등)을 에이전트가 설치하지 않는다. 없으면 사람에게 부탁한다.
- 비밀번호·토큰·인증 코드를 에이전트가 묻거나, 입력하거나, 파일에 적지 않는다. 로그인은 사람이 창에서 한다.
- 강제 푸시, 기록 다시 쓰기(이미 푸시한 커밋의 `--amend`, `rebase`), 저장소 지우기·이름 바꾸기·공개 범위 바꾸기를 에이전트가 하지 않는다.
- 학생 이름·학번이 든 파일을 커밋하지 않는다(PG2). 파일을 지우지 않는다(사람이 옮긴다).
- 브라우저 인쇄 창을 띄우지 않는다.
- 작업 폴더를 옮기지 않는다. `C:\Users\PC-11\Desktop\랄프톤` 안에서 끝까지 한다.
- 같은 공개 주소 요청을 1분보다 짧은 간격으로 되풀이하지 않는다.
- 모든 확인은 실제 출력으로 적는다. "될 것이다"로 적지 않는다.
- 2차 루프(`loop2/`) 항목은 하지 않는다.
- PG9가 통과하기 전에 0-1의 배포 마감 시각이 지나면 그 자리에서 12장 계획 B로 멈춘다. 매 작업을 시작하기 전에 시각을 본다. PG9 통과 뒤에는 마감과 상관없이 끝까지 한다.
- 사람 차례(로그인 창, Pages 켜기, 파일 공개 여부, 사이트 승인)에서는 할 일을 한 문장으로 알리고 턴을 끝내 답을 기다린다.
- 편집기를 여는 Git 명령, 글자로 입력을 기다리는 명령을 쓰지 않는다(6장 멈춤 방지).

## 14. 끝의 기준

- PG1~PG12, PG14가 PROGRESS에 증거와 함께 통과로 적혀 있다. PG13은 사람이 확인한다(에이전트의 끝 기준에서 뺀다).
- 두 번째 확인(기다리기 없이): `node tools/check_pages.mjs <공개 주소>` → 같음 n/n, 종료 코드 0. `git fetch origin` 뒤 `git rev-parse HEAD` = `git rev-parse origin/main`.
- `node --test` 전체 통과(PG1과 같은 건수).
- 공개 주소가 7-1 PG14 "기록할 곳" 중 있는 곳 모두에 같은 글자로 적혀 있다.
- 또는 계획 B: 12장대로 멈추고 PROGRESS에 사유가 있다.
- 보고(짧게): 공개 주소, 커밋 해시, check_pages 결과 줄, 데모 1~8단계 결과, 375/320px·콘솔·404, 사람이 할 일(PG13 휴대폰 확인, 심사 주소 바꾸기), 남은 위험(학교 망 차단, 학교 시약 목록 공개 확인 여부). 계획 B로 멈췄으면 막힌 단계와 마지막 오류 글자. 그다음 멈춘다.
