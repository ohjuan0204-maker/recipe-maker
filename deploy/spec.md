# 배포 명세 — 용액 레시피 메이커 공개 사이트 (GitHub Pages)

> 작성: 2026. 11. 17. claude.ai 대화의 Claude가 초안을 썼고, 사람이 검토해 확정한다.
> 이 문서는 프로젝트의 `SPEC.md`를 대신하지 않는다. "대회 컴퓨터의 랄프톤 폴더를 누구나 로그인 없이 여는 공개 주소 하나로 만드는 일"만 다룬다. 앱의 기능은 바꾸지 않는다.
> 놓을 곳: 대회 컴퓨터의 **랄프톤 폴더** 안 `deploy/spec.md`. 함께 쓰는 프롬프트는 `deploy/prompt.md`. Claude Code도 이 랄프톤 폴더에서 연다.
> 저장소 이름은 영문이어야 하므로 폴더 이름(랄프톤)과 상관없이 `recipe-maker`로 둔다. 공개 주소는 저장소 이름으로 정해진다.
> **[사람 확인]** 표시가 붙은 줄은 출발 전에 사람이 확인하거나 고친다. 고치지 않으면 적힌 대로 진행한다.
> 왜 따로 하나: 배포가 이번 대회의 단일 실패 지점이다. 1차 때 이 컴퓨터에는 Git도 없었다. 여기서 막히면 2차 루프가 아무리 잘 돼도 심사·체험 투표에 낼 주소는 공유해 둔 claude.ai 아티팩트(1차 이전 화면)뿐이다. 대회 규칙 ④는 "링크 클릭만으로 실행되는 웹앱(로그인 불필요)"을 최종 결과물로 요구하고, 전교생 체험 투표(25점)는 그 링크에서 '체험 완료 코드'를 받아야 할 수 있다. 그래서 배포를 2차 런(20:30~21:05) 막바지에 처음 시도하지 않고, 사람 준비는 Phase 1에, 첫 배포는 가능한 한 일찍 끝낸다(0-1장).

## 0. 출발 전에 채울 것 (사람)

| 칸 | 적을 값 | 비어 있으면 |
|---|---|---|
| GitHub 아이디 | `ohjuan0204-maker` | 출발하지 않는다. 계정이 없으면 github.com에서 만든다(메일 인증까지). |
| 저장소 이름 | `recipe-maker` | `recipe-maker`. 영문 소문자·숫자·`-`만 쓴다. 한글·띄어쓰기 금지. |
| 공개 주소(예상) | `https://ohjuan0204-maker.github.io/recipe-maker/` (2026. 11. 17. 19:59 반영, 실제 주소) | 아이디와 저장소 이름으로 저절로 정해진다. 아이디는 주소에서 소문자로 바뀐다. |
| 커밋에 적을 이름 | `Mol-Loop` | 팀 이름(예: `Mol-Loop`)이어도 된다. 실명이 아니어도 된다. |
| 커밋에 적을 메일 | `356137520+ohjuan0204-maker@users.noreply.github.com` | GitHub 설정 → Emails의 `…@users.noreply.github.com` 주소를 권한다(학교 메일을 공개 기록에 남기지 않게). |
| 저장소를 Public으로 해도 되는가 | `예` (시약 목록 확인은 사람이 "생략"이라고 함) | 무료 계정은 Public 저장소만 Pages를 켤 수 있다. `아니오`면 계획 B(6장). `reagents.js`의 학교 시약 목록이 함께 공개된다는 점을 선생님께 확인했는지도 적는다: `확인함 / 아직` |
| 첫 배포 마감 | `20:30` | 2차 런이 시작되기 전까지 공개 주소에 1차 결과가 떠 있어야 한다. 안 떴으면 중간 점검(20:20~20:30)에 5장 표로 원인을 찾아 SPEC·PROMPT를 고친다. |
| 최종 마감 | `21:00` | 2차 런의 마지막 푸시와 확인(check_pages 같음 n/n)까지. 이때 안 뜨면 계획 B(6장). Phase 4(21:05~) 패들렛 게시에 쓸 주소가 이때 정해진다. |
| 체험 완료 코드 | `1004` | **빈칸·`미정` 금지.** 규칙 ④가 "핵심 흐름을 마치면 팀별 체험 완료 코드가 나타나도록" 요구하고, 체험 투표는 이 코드를 입력해야 한다. 운영진이 정해 준 코드가 있으면 그것, 없으면 팀이 정해 운영진에게 알린다. 앱에 넣는 것은 에이전트가 한다(3장 예외 2). |
| 운영요원 확인 | `____` | 런 중에 휴대폰(다른 기기)으로 GitHub 설정을 바꾸는 것이 가재탈 대상인지(노트북은 만지지 않음). 확인 못 했으면 그런 일은 런 밖(Phase 1, 중간 점검)에서만 한다. |

## 0-1. 대회 일정·규칙과 맞추기

| 시간 (대회 시간표) | 누가 | 이 배포에서 할 일 |
|---|---|---|
| 19:10~19:50 Phase 1 설계 | 사람 | 0장 채우기. Git 설치, GitHub CLI(`gh`) 설치, `gh auth login` → `gh auth setup-git`, `git config --global user.name/email`, 빈 Public 저장소 만들기(휴대폰으로 해도 된다). **노트북을 만져야 하는 일은 모두 여기서 끝낸다.** 런 중에 로그인 창이 뜨면 가재탈이 된다. |
| 19:50~20:20 Phase 2 1차 런 | 에이전트 | 1차 프롬프트 맨 앞에 "deploy/spec.md의 PG1~PG9를 먼저 하고, Pages 반영을 기다리는 동안 1차 작업을 한다"를 넣는다(권장). 첫 배포가 일찍 끝나야 그 뒤 푸시는 1~2분 만에 반영된다. |
| 20:20~20:30 중간 점검 | 사람 | 휴대폰으로 공개 주소를 열어 본다(PG13). 안 떴으면 5장 표로 원인을 찾고 FIX 로그에 적은 뒤 SPEC·PROMPT를 고친다(코드는 고치지 않는다). Pages가 아직 꺼져 있으면 이때 켠다. |
| 20:30~21:05 Phase 3 2차 런 | 에이전트 | 2차 루프가 F번호마다 커밋·푸시 → 공개 주소가 저절로 새 버전. 21:00까지 마지막 푸시와 check_pages 같음 n/n, 체험 완료 코드가 공개 주소에서 보이는지 확인. |
| 21:05~21:30 Phase 4 정리 | 사람 | 패들렛에 공개 주소, [양식2] 발표 차트, 제출 묶음(SPEC.md, PROMPT.md, 진행 로그, FIX 로그). 계획 B면 아티팩트 링크. |
| 21:30~21:50 Phase 5 쇼케이스 | 사람 | 공개 주소로 3분 시연(문제 → 핵심 흐름 → AI에 맡긴 일과 직접 확인·수정한 사례). 배포가 막혔다가 고친 일은 "직접 확인·수정한 사례"로 쓸 수 있다. |

- 가재탈 룰(규칙 ②): 런 중에 노트북을 만지면 가재탈을 쓰고 운영요원에게 이유를 알린 뒤 [양식4]에 기록한다. 그래서 이 문서는 런 중 사람이 할 일을 0으로 만드는 쪽으로 짰다: 로그인은 Phase 1에 `gh auth login`으로, Pages 켜기는 에이전트가 `gh api`로(또는 사람이 휴대폰으로, 0장 운영요원 확인에 따라).
- 규칙 ⑤: 실제 개인정보·민감정보 금지, API 키를 HTML·JS에 넣지 않음 → PG2.
- 규칙 ⑥: 진행 로그(PROGRESS.md 또는 progress.txt)와 FIX 로그에 배포의 실패·수정도 적는다 → PG14.

## 1. 지금 상태 (다시 하지 않는다)

- 앱은 정적 웹앱이다: `index.html` + 일반 `<script>` 14개(`reagents.js`, `calc.js`, `labcalc.js`, `experiments.js`, `theory.js`, `search.js`, `curve.js`, `share.js`, `waste.js`, `filein.js`, `plan.js`, `error.js`, `topics.js`, `app.js`) + `style.css` + `fonts/`(fonts.css, woff2·woff 각 6개, LICENSE.txt). 1차 루프에서 파일이 늘었을 수 있으니 0단계에서 `index.html`을 직접 읽어 목록을 다시 만든다.
- 빌드 단계가 없다. 폴더 그대로가 사이트다. npm 설치·번들러·프레임워크가 필요 없다.
- 모든 경로는 상대 경로이고 외부 주소(CDN, 글꼴 서버, API)를 부르지 않는다(SPEC 6장). 그래서 하위 주소(`/recipe-maker/`)에서도 동작해야 한다. claude.ai의 로컬 서버 하위 주소 확인(`http://localhost:8765/recipe-maker/`)에서 통과한 적이 있다.
- 작품명은 `<title>용액 레시피 메이커</title>`이고 홈 왼쪽 위에도 같은 글자가 있다.
- 크기는 `.git`을 빼고 약 3.5 MB(글꼴 약 2 MB)다. GitHub의 파일당 한도(100 MB)와 Pages 한도(1 GB)에 한참 못 미친다.
- 공유해 둔 claude.ai 아티팩트(`https://claude.ai/artifact/Mob8rSJwr9iFMWcneU4yue`)는 1차 이전 화면이다. 이 배포가 끝나면 심사·체험 투표 주소를 GitHub Pages 주소로 바꾼다.

## 2. 범위

1. Git 저장소 만들기(로컬), 첫 커밋, GitHub로 첫 푸시
2. GitHub Pages 켜기(사람) — `main` 브랜치, `/ (root)` 폴더
3. 공개 주소가 뜨는지, 모든 파일이 공개 주소에서 로컬 커밋과 같은 내용으로 오는지 확인(도구 `tools/check_pages.mjs`)
4. 공개 주소에서 데모 1~8단계, 375px, 콘솔 오류 확인
5. 기록: PROGRESS.md "배포", SPEC.md 8장 공개 주소, README.md 공개 주소, `loop2/spec.md` 0장의 공개 주소 칸

만들지 않음: 앱 기능 바꾸기, 디자인 바꾸기, 새 계산, 2차 루프 항목(F02~F26), GitHub Actions 워크플로 파일, 사용자 정의 도메인, 빌드 도구, 분석·추적 스크립트, 외부 라이브러리.

## 2-1. 우선순위

| 순위 | 항목 | 이유 |
|---|---|---|
| 0 | 사람 준비물(0장 표, Git 설치, 빈 저장소) | 사람만 할 수 있다. 없으면 에이전트가 아무것도 못 한다. |
| 1 | PG1~PG4 공개해도 되는 파일만 커밋 | 한 번 푸시한 것은 공개 기록에 남는다. 학생 이름·학번이 든 문서가 섞이면 되돌리기 어렵다. |
| 2 | PG5~PG7 첫 푸시와 Pages 켜기 | 가장 막히기 쉽다(로그인, 저장소 비공개, 브랜치 이름). |
| 3 | PG8~PG10 공개 주소의 파일 대조 | "뜨긴 뜨는데 화면이 깨짐"(대소문자, 빠진 파일, 캐시)을 잡는다. |
| 4 | PG11~PG13 화면 확인 | 심사·체험 투표에서 실제로 보이는 것. |
| 5 | PG14 기록 | 2차 루프가 공개 주소를 쓸 수 있게. |

## 3. 고정 사실 (이 배포에서 바꾸지 않는다)

| 항목 | 값 |
|---|---|
| 작품명 | 용액 레시피 메이커 |
| 저장소 | `https://github.com/<아이디>/recipe-maker` (0장) |
| 공개 주소 | `https://<아이디 소문자>.github.io/recipe-maker/` — 끝의 `/`까지 포함 |
| 브랜치 | `main` 하나. 다른 브랜치를 만들지 않는다. |
| Pages 설정 | Source "Deploy from a branch", Branch `main`, 폴더 `/ (root)` |
| 저장소의 맨 위 | Claude Code를 연 **랄프톤 폴더**. 그 안의 내용이 저장소 맨 위가 된다. 랄프톤 폴더째 한 단계 더 넣지 않는다. |
| 사이트의 첫 파일 | `index.html`. 랄프톤 폴더 맨 위에 있으면 공개 주소는 `https://<아이디>.github.io/recipe-maker/`. 하위 폴더(예: `랄프톤/app/index.html`)에 있으면 공개 주소는 `https://<아이디>.github.io/recipe-maker/<하위 폴더>/`이고, 하위 폴더 이름에 한글·띄어쓰기가 있으면 주소가 깨지기 쉬우니 PG1에서 사람에게 알린다(폴더를 옮기거나 이름을 바꾸는 일은 에이전트가 하지 않는다). |
| 앱 코드 | 바꾸지 않는다. 예외 1: PG3에서 참조 경로의 글자 크기(대·소문자)가 실제 파일과 다를 때 참조 쪽을 실제 파일 이름에 맞추는 것. 예외 2: 체험 완료 코드가 빈칸·`미정`으로 보이면 0장의 코드로 바꾸는 것(규칙 ④). 둘 다 `node --test`가 통과해야 하고 PROGRESS에 적는다. |
| 강제 푸시 | 하지 않는다(`--force`, `-f` 금지). |

## 4. 할 일과 확인 기준

번호는 PG1~PG14다(Pages). SPEC.md의 A18(공개 주소)을 이 문서의 PG8·PG11로 확인한다. 확인 방법은 명령과 기대 출력, 또는 미리보기에서 할 조작과 화면에 나올 글자다.

### PG1 시작 상태 — 폴더와 도구

- 지금 폴더가 대회 컴퓨터의 랄프톤 폴더다(`pwd` 또는 PowerShell `Get-Location` 출력을 적는다). `index.html`이 맨 위에 있는지, 하위 폴더에 있는지 찾는다(3장 "사이트의 첫 파일"). `SPEC.md`, `PROMPT.md`(또는 `TASKS.md`)의 위치도 적는다.
- 폴더 경로에 한글이 있어도 Git과 Node는 동작한다. 다만 명령에 경로를 쓸 때는 따옴표로 감싼다.
- `git --version` → `git version 2.`로 시작. 없으면 멈추고 사람에게 설치를 부탁한다(5장 표).
- `node --version` → v18 이상(이 문서의 확인 도구가 Node의 `fetch`를 쓴다).
- `node --test` 전체 통과. 건수를 적는다(1차 끝 기준 148건으로 알려져 있으나 그대로 믿지 않고 실제 건수를 적는다).
- `tools/check_mw.mjs`가 있으면 `node tools/check_mw.mjs reagents.js` 오류 0.
- 확인: PROGRESS.md "배포" 절에 위 다섯 줄의 실제 출력 한 줄씩.

### PG2 공개하면 안 되는 파일 거르기

- 폴더 전체(하위 포함)에서 `.hwp`, `.hwpx`, `.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.pptx`, `.zip`, `.png`·`.jpg`(스크린샷), `.env`, `*.key`, `*.pem`을 찾는다. `tests/fixtures/`의 시험용 파일(지어낸 값, README에 그렇게 적힘)은 남긴다.
- 대회 참가 신청서처럼 **학생 이름·학번**이 들어 있을 수 있는 문서가 나오면 커밋하지 않는다. 목록을 사람에게 보여 주고 `.gitignore`에 넣거나 폴더 밖으로 옮겨 달라고 한다(에이전트가 지우지 않는다).
- 글 파일(`*.md`, `*.js`, `*.html`, `*.css`, `*.json`, `*.txt`)에서 열쇠처럼 보이는 글자를 찾는다: `sk-`, `AKIA`, `ghp_`, `github_pat_`, `api_key`, `apikey`, `password`, `token=`. 나오면 무엇인지 확인하고, 진짜 비밀이면 커밋하지 않는다.
- 학번처럼 보이는 숫자 묶음(예: 다섯 자리 숫자 옆에 사람 이름)이 글 파일에 있는지 본다. 있으면 사람에게 확인한다.
- 확인: PROGRESS.md에 "공개 점검: 문서 파일 n개(시험용 m개는 남김), 걸린 것 k개 → 처리"를 적는다.

### PG3 경로 점검 — 하위 주소와 대소문자

GitHub Pages는 리눅스처럼 **대소문자를 가린다.** 윈도우에서는 `Reagents.js`와 `reagents.js`가 같은 파일로 열리지만 공개 주소에서는 404다. 또 공개 주소는 하위 주소(`/recipe-maker/`)라 `/`로 시작하는 경로는 깨진다.

- `index.html`의 모든 `src="…"`, `href="…"`와 `fonts/fonts.css`의 모든 `url(…)`을 모은다(`data:`, `#…`, `mailto:`는 뺀다).
- 각 경로가 (1) `/`나 `\`로 시작하지 않고 `\`가 없으며, (2) `http://`·`https://`·`//`로 시작하지 않고, (3) `git ls-files`(커밋 뒤) 또는 실제 폴더 목록과 **글자 그대로**(대소문자까지) 같은 파일을 가리키는지 본다. 윈도우의 `existsSync`는 대소문자를 무시하므로 쓰지 않고, 부모 폴더의 `readdirSync` 목록과 글자 그대로 견준다.
- app.js 등 스크립트 안에서 부르는 파일 경로(예: `fetch('…')`, `new Worker('…')`, `import(…)`)가 있으면 같은 점검을 한다. 없으면 "없음"이라고 적는다.
- 파일 이름에 한글·띄어쓰기가 있는 파일을 사이트가 부르지 않는지 본다.
- 확인: `tools/check_pages.mjs --local`(PG8) 출력 "경로 n개, 문제 0개".

### PG4 `.nojekyll`과 `.gitignore`

- 맨 위에 빈 파일 `.nojekyll`을 만든다. GitHub Pages가 Jekyll로 폴더를 가공하지 않고 그대로 내보내게 한다(밑줄로 시작하는 파일 무시, 빌드 실패, 느린 반영을 막는다).
- `.gitignore`가 있으면 사이트에 필요한 파일(`*.js`, `*.css`, `fonts/*`, `index.html`)을 빼 버리지 않는지 `git check-ignore -v <파일>`로 본다. 걸리면 그 줄을 고친다.
- `.gitignore`에 넣을 것: `node_modules/`, `.DS_Store`, `Thumbs.db`, `*.log`, PG2에서 사람이 빼기로 한 파일.
- 확인: `git status --short --ignored`에 사이트 파일이 `!!`(무시됨)로 나오지 않는다.

### PG5 첫 커밋

- 저장소가 아니면 `git init -b main`. 이미 저장소인데 브랜치가 `master`면 `git branch -M main`.
- `git config user.name`, `git config user.email`이 비어 있으면 0장 값으로 이 저장소에만 설정한다(`git config user.name "…"`, 전역 `--global`은 사람이 원할 때만).
- 윈도우 줄 끝: `git config core.autocrlf`가 무엇이든 그대로 둔다. 대조(PG9)는 작업 폴더 파일이 아니라 커밋된 내용(`git show HEAD:<경로>`)으로 한다.
- `git add -A` → `git status --short`로 올라갈 파일 수를 세고 PG2에서 걸러야 할 것이 없는지 한 번 더 본다 → `git commit -m "배포 PG5: 1차 루프 끝 상태"`.
- 확인: `git log --oneline -1`, `git ls-files | wc -l`(또는 PowerShell `(git ls-files).Count`)를 PROGRESS에 적는다.

### PG6 첫 푸시 (사람이 로그인 창을 끝낸다)

- `git remote -v`가 비어 있으면 `git remote add origin https://github.com/<아이디>/recipe-maker.git`.
- 푸시 전에 `gh auth status`(gh가 있으면)와 `git config --get credential.helper`로 Phase 1에 로그인해 두었는지 본다. 로그인돼 있으면 로그인 창이 뜨지 않는다.
- `git push -u origin main`. 로그인이 안 돼 있으면 Git Credential Manager의 로그인 창(또는 브라우저)이 뜬다. **에이전트는 사람에게 "로그인 창이 떴습니다. 런 중이면 가재탈을 쓰고 운영요원에게 알린 뒤 GitHub 로그인 → Authorize를 눌러 주세요([양식4]에 기록)"라고 알리고 기다린다.** 아이디·비밀번호·토큰을 에이전트가 입력하거나 요청하지 않는다.
- 터미널이 사용자 이름·비밀번호를 글자로 묻는 경우(로그인 창이 없는 경우)는 멈추고 사람에게 5장의 방법(GitHub CLI `gh auth login` 후 `gh auth setup-git`)을 부탁한다.
- 거절되면 5장 표를 따른다. 강제 푸시는 하지 않는다.
- 확인: 두 번째 `git push` → `Everything up-to-date`, 아무것도 묻지 않는다. 이후 에이전트의 푸시가 멈추지 않는다는 뜻이다.

### PG7 Pages 켜기 (사람)

- 에이전트가 사람에게 알린다: "저장소 Settings → 왼쪽 Pages → Build and deployment의 Source를 'Deploy from a branch'로, Branch를 `main`, 폴더를 `/ (root)`로 고르고 Save를 눌러 주세요."
- GitHub CLI(`gh`)가 있고 사람이 이미 `gh auth login`을 했다면 에이전트가 대신 켤 수 있다: `gh api -X POST repos/<아이디>/recipe-maker/pages -f "source[branch]=main" -f "source[path]=/"`. 이미 켜져 있다는 오류(409)면 그대로 진행한다. `gh`가 없으면 설치하지 말고 사람에게 부탁한다.
- Settings → Pages 화면에 "Upgrade or make this repository public"이 보이면 저장소가 Private이다. 사람이 Settings → General 맨 아래 Danger Zone → Change visibility → Public으로 바꾼다(0장에서 `예`일 때만).
- 확인: Settings → Pages 위쪽에 "Your site is live at https://…"(반영 중이면 "Your site is ready to be published")가 보인다. `gh`가 있으면 `gh api repos/<아이디>/recipe-maker/pages`의 `html_url`.

### PG8 확인 도구 `tools/check_pages.mjs`

에이전트가 만든다. 외부 라이브러리 없이 Node 18 이상의 기본 기능(`fetch`, `crypto`, `fs`, `child_process`)만 쓴다. 사이트 코드가 아니라 확인 도구라서 `tools/`에 둔다.

- 쓰는 법: `node tools/check_pages.mjs --local` (커밋·경로만 점검), `node tools/check_pages.mjs https://<아이디>.github.io/recipe-maker/` (공개 주소 대조).
- 하는 일:
  1. `index.html`에서 `src`/`href`, `fonts/fonts.css`에서 `url()`을 모아 사이트 파일 목록을 만든다(`index.html`, `fonts/fonts.css` 포함, `data:`·`#`은 뺀다). 스크립트 안의 `fetch('…')` 같은 문자열 경로도 PG3에서 찾은 것이 있으면 넣는다.
  2. `--local`: PG3의 세 조건(상대 경로, 외부 주소 없음, `git ls-files`에 글자 그대로 있음)을 검사하고 문제마다 한 줄 출력.
  3. 주소가 주어지면 파일마다 `fetch(주소 + 경로, { cache: 'no-store' })` → 상태 코드, `content-type`, 내용의 sha256을 구하고, `git show HEAD:<경로>`(바이너리는 그대로 바이트로)의 sha256과 견준다. 주소가 `/`로 끝나지 않으면 붙인다.
  4. 첫 화면(`주소` 그 자체)의 HTML에 `<title>용액 레시피 메이커</title>`가 있는지 본다.
  5. 결과 줄: `200 text/javascript; charset=utf-8  같음  app.js`처럼. 마지막 줄: `파일 n개: 같음 a, 다름 b, 404 c, 그 밖 d` 와 커밋 해시. 하나라도 같지 않으면 종료 코드 1.
  6. `--wait 15`를 주면 모두 같아질 때까지 60초마다 다시 본다(최대 15분). 같은 요청을 1분보다 짧은 간격으로 되풀이하지 않는다.
- 내용 종류 기대값: `.html` text/html, `.js` text/javascript 또는 application/javascript, `.css` text/css, `.woff2` font/woff2, `.woff` font/woff, `.txt` text/plain. 다르면 경고만(실패로 보지 않는다).
- 확인: `--local` → 문제 0개. 일부러 없는 경로 하나를 넣은 임시 HTML로 돌리면 그 경로가 404/없음으로 나온다(도구가 실제로 잡는지 한 번 보고 임시 파일은 지운다).

### PG9 공개 주소 반영 기다리기

- Pages를 켠 뒤 첫 반영은 보통 1~3분, 길면 10분 걸린다. 저장소 Actions 탭의 `pages build and deployment`가 초록이면 반영된 것이다(`gh`가 있으면 `gh run list --limit 3`).
- `node tools/check_pages.mjs <공개 주소> --wait 15`.
- GitHub Pages는 파일을 약 10분 동안 캐시한다(`Cache-Control: max-age=600`). 새 커밋 뒤 예전 내용이 보이면 기다린다. 브라우저 확인은 시크릿 창이나 강력 새로 고침(Ctrl+F5)으로 한다.
- 확인: "파일 n개: 같음 n" 과 커밋 해시가 `git rev-parse --short HEAD`와 같다.

### PG10 깊은 주소와 새로 고침

- 앱은 화면을 `#solid`, `#dilution`, `#recipe`, `#waste`처럼 `#` 뒤 글자로 바꾼다. 서버 쪽 경로가 아니므로 Pages에서 404가 나지 않아야 한다.
- 확인: `<공개 주소>#solid`, `<공개 주소>#waste`를 시크릿 창에서 바로 열면 그 화면이 뜬다. 끝의 `/` 없이 `https://<아이디>.github.io/recipe-maker`를 열면 GitHub가 `/`를 붙인 주소로 옮겨 주고 화면이 깨지지 않는다.

### PG11 공개 주소에서 데모 1~8단계 (A18)

- 미리보기 도구(1차 루프에서 쓴 것)로 공개 주소를 연다. 로그인 없이 열려야 한다.
- SPEC.md 2장 데모 시나리오 1~8단계를 그대로 한다(지금은 1차 끝 상태의 데모다. 2차의 새 4단계는 2차 루프에서 다시 본다). 단계마다 화면에 보여야 할 글자를 확인한다.
- 1분 체험: 홈의 [1분 체험] → 7단계 → [끝내기] → 홈.
- **체험 완료 코드(규칙 ④):** 핵심 흐름을 마치면 0장의 코드가 화면에 보인다. `미정`·빈칸이면 실패로 보고 3장 예외 2로 고친 뒤 커밋·푸시하고 공개 주소에서 다시 본다.
- 라벨은 화면 미리보기까지만 본다. **브라우저 인쇄 창을 띄우지 않는다.**
- 글꼴: 한글이 앱의 글꼴(fonts/)로 그려진다. 개발자 도구 네트워크에 `fonts/hangul-400.woff2`가 200으로 온다.
- 확인: PROGRESS에 단계별 "통과/실패 + 본 글자" 한 줄씩. A18은 SPEC.md 7장 문구 그대로 통과를 적는다.

### PG12 휴대폰 너비와 콘솔

- 너비 375px와 320px에서 홈, 용액 조제, 희석, 레시피, 폐액 화면의 가로 스크롤이 없다(`document.documentElement.scrollWidth <= innerWidth`).
- 콘솔 오류 0개(경고는 적어만 둔다). 네트워크 404 0개(`favicon.ico` 요청이 있으면 그것도 0개여야 한다. 앱은 `href="data:,"`로 파비콘 요청을 막아 두었다).
- 확인: PROGRESS에 너비별 결과와 콘솔·404 개수.

### PG13 다른 기기 (사람)

- 사람이 자기 휴대폰으로 공개 주소를 연다. **모바일 데이터와 학교 와이파이 둘 다.** 학교 망이 `github.io`를 막는 경우가 있다. 막히면 체험 투표 안내에 "모바일 데이터로 열어 주세요"를 넣거나 계획 B의 아티팩트 주소를 함께 적는다.
- 아이폰 사파리, 안드로이드 크롬에서 [1분 체험] 1~2단계까지 눌러 본다.
- 확인: 사람이 PROGRESS에 "기기·망·결과" 한 줄씩(에이전트는 결과를 받아 적기만 한다).

### PG14 기록과 다음 단계 연결

- PROGRESS.md "배포" 절(진행 로그가 progress.txt면 거기도 한 줄): 공개 주소, 커밋 해시, PG1~PG13 결과, 걸린 시간, 막힌 것과 푼 방법.
- FIX 로그(규칙 ⑥, 파일 이름은 폴더에서 찾는다. 없으면 `FIX.md`를 만든다): 배포 중 실패한 것과 명세·프롬프트를 어떻게 고쳤는지 한 줄씩. 실패가 없으면 "배포: 실패 없음".
- SPEC.md 8장(고정 사실)의 공개 주소 줄을 실제 주소로(지금 "미정"이면). SPEC.md 10장 제출 요건에 주소가 있으면 거기도.
- README.md 맨 위 가까이에 "공개 주소: https://…" 한 줄.
- `loop2/spec.md`가 있으면 0장 공개 주소 칸과 "시크릿 창에서 열어 본 시각" 칸을 채운다.
- TASKS.md에 배포 줄(예: "공개 배포 (GitHub Pages)", T번호는 실제 파일에서 찾는다)이 있으면 [x]. 사람이 할 일로 남은 줄(PG13)은 그대로 둔다.
- 커밋 `배포 PG14: 공개 주소 기록` → 푸시 → `check_pages.mjs <주소> --wait 15`가 다시 "같음"이 될 때까지 확인.

## 5. 막혔을 때

| 보이는 것 | 까닭 | 할 일 (누가) |
|---|---|---|
| `git: command not found` / `'git'은(는) 내부 또는 외부 명령…이 아닙니다` | Git이 없거나 설치 뒤 터미널을 새로 열지 않음 | 사람: `winget install --id Git.Git -e --source winget` 또는 git-scm.com에서 설치 → 터미널과 Claude를 새로 연다 |
| `Author identity unknown` | 커밋 이름·메일이 없음 | 에이전트: 0장 값으로 `git config user.name/email` |
| `src refspec main does not match any` | 커밋이 없거나 브랜치가 `master` | 에이전트: 커밋 확인, `git branch -M main` |
| 로그인 창이 안 뜨고 터미널이 Username을 물음 | Git Credential Manager가 없음 | 사람: `winget install --id GitHub.cli` → `gh auth login`(GitHub.com, HTTPS, 브라우저 로그인) → `gh auth setup-git`. 에이전트는 비밀번호·토큰을 받지 않는다 |
| `remote: Repository not found` | 주소 오타, 다른 계정으로 로그인, 저장소가 없음 | 사람: 저장소 주소와 로그인한 계정 확인. 에이전트: `git remote set-url origin …` |
| `! [rejected] main -> main (fetch first)` | 저장소를 만들 때 README·라이선스를 넣어 비어 있지 않음 | 에이전트: `git pull origin main --allow-unrelated-histories --no-edit` → 충돌이 README.md뿐이면 우리 것을 남기고 커밋 → 푸시. 강제 푸시 금지 |
| `remote: error: File … is 1xx MB; this exceeds GitHub's file size limit` | 큰 파일(zip, 동영상) | 에이전트: 그 파일을 `.gitignore`에 넣고 `git rm --cached` → 커밋 고치기(`git commit --amend`, 아직 푸시 전이므로) |
| Pages 설정에 "Upgrade or make this repository public" | 저장소가 Private | 사람: Public으로(0장 `예`일 때). `아니오`면 계획 B |
| 공개 주소가 "404 There isn't a GitHub Pages site here" | Pages를 안 켰거나, 브랜치·폴더가 다르거나, 아직 반영 중 | 사람: Settings → Pages 다시 확인(main, /root). 에이전트: Actions 탭 상태, 10분까지 기다림 |
| Actions의 pages build가 빨강 | Jekyll 처리 실패 | 에이전트: `.nojekyll` 있는지(PG4), 커밋·푸시 |
| 화면이 뜨는데 글자만 있고 모양이 없음 / 빈 화면 | `style.css`나 스크립트 404(대소문자, `/`로 시작하는 경로) | 에이전트: `check_pages.mjs`의 404 줄 → 참조를 실제 파일 이름에 맞춤(3장 예외) |
| 한글 글꼴만 다름 | `fonts/` 파일 404 또는 `fonts.css`의 `url()` 대소문자 | 에이전트: 같은 방법 |
| 고쳤는데 예전 화면 | Pages 캐시(약 10분)나 브라우저 캐시 | 기다림, 시크릿 창, `check_pages.mjs --wait` |
| 휴대폰에서 학교 와이파이로만 안 열림 | 학교 망 차단 | 사람: 모바일 데이터로 안내, 계획 B 주소 함께 |
| `LF will be replaced by CRLF` 경고 | 윈도우 줄 끝 변환 | 무시해도 된다. 대조는 커밋 내용으로 한다(PG9) |

## 6. 계획 B (배포 마감 시각까지 공개 주소가 안 뜰 때)

- 에이전트: 그 자리에서 멈추고 PROGRESS에 막힌 단계, 마지막 오류 글자, 해 본 것을 적는다. 커밋은 남긴다(나중에 푸시만 하면 된다).
- 사람: 이 폴더를 zip으로 묶어(`.git` 빼도 된다) claude.ai 대화에 올리고 "아티팩트에 올려 줘"라고 한다. 공유해 둔 아티팩트 링크(`https://claude.ai/artifact/Mob8rSJwr9iFMWcneU4yue`)가 이 폴더의 내용으로 바뀐다. 이 링크를 심사·체험 투표 주소로 쓴다.
- `loop2/spec.md` 0장 공개 주소 칸에 `계획 B`라고 적는다. 2차 루프는 A18을 [!]로 두고 나머지를 한다.
- 배포는 2차 루프가 끝난 뒤나 다음 날(체험 투표 11. 18. 전) 다시 시도할 수 있다. 그때는 이 문서를 처음부터 다시 쓴다(PG1부터).

## 7. 지킬 것

- 앱 기능·디자인·계산을 바꾸지 않는다(3장 예외만). 고정 사실은 3장 밖으로 바꾸지 않는다.
- 외부 API·라이브러리·글꼴·분석 스크립트를 넣지 않는다(SPEC 6장). 확인 도구도 Node 기본 기능만.
- 비밀번호·토큰·인증 코드를 에이전트가 묻거나, 입력하거나, 파일에 적지 않는다. 로그인은 사람이 창에서 한다.
- 강제 푸시, 기록 다시 쓰기(이미 푸시한 커밋의 `--amend`, `rebase`), 저장소 지우기·이름 바꾸기·공개 범위 바꾸기를 에이전트가 하지 않는다.
- 학생 이름·학번이 든 파일을 커밋하지 않는다(PG2).
- 브라우저 인쇄 창을 띄우지 않는다.
- 작업 폴더를 옮기지 않는다. 랄프톤 폴더 안에서 끝까지 한다.
- 같은 공개 주소 요청을 1분보다 짧은 간격으로 되풀이하지 않는다.
- 모든 확인은 실제 출력으로 적는다. "될 것이다"로 적지 않는다.

## 8. 끝의 기준

- PG1~PG12, PG14가 PROGRESS에 증거와 함께 통과로 적혀 있다. PG13은 사람이 적는다(에이전트의 끝 기준에서 뺀다).
- `node tools/check_pages.mjs <공개 주소>` → 같음 n/n, 종료 코드 0, 커밋 해시가 `HEAD`와 같다.
- `node --test` 전체 통과(PG1과 같은 건수).
- 공개 주소가 0장, SPEC.md 8장, README.md, `loop2/spec.md` 0장에 같은 글자로 적혀 있다.
- 공개 주소에서 핵심 흐름을 마치면 0장의 체험 완료 코드가 보인다(규칙 ④).
- 또는 계획 B: 6장대로 멈추고 PROGRESS에 사유가 있다.
