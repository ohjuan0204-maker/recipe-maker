# TASKS — 공개 배포 (GitHub Pages)

명세: 같은 폴더의 `SPEC.md`. 작업 폴더: `C:\Users\PC-11\Desktop\랄프톤` (옮기지 않는다).

규칙
- 위에서부터 하나씩. 확인이 통과하고 맨 위 `PROGRESS.md`의 `## 배포 (GitHub Pages)` 절에 **실제 출력**을 증거로 적은 뒤에만 [x]로 바꾼다.
- 표시: [ ] 할 일 · [x] 완료 · [!] 막힘 (사유는 PROGRESS.md) · [-] 건너뜀 · [사람] 사람이 할 일
- 매 작업을 시작하기 전에 시각을 본다. **T09(PG9)가 통과하기 전에** SPEC 0-1의 배포 마감 시각이 지났으면 그 자리에서 T98(계획 B)로 간다. T09 통과 뒤에는 마감과 상관없이 끝까지 한다.
- 막히면 SPEC 11장 표에서 같은 증상을 찾아 그대로 한다. 같은 방법을 세 번 넘게 되풀이하지 않는다. 세 번 실패하면 [!]로 두고 사람에게 묻는다.
- 앱 코드·디자인·계산은 바꾸지 않는다(SPEC 8장의 대소문자 예외만). 프로그램은 설치하지 않는다. 비밀번호·토큰은 묻지도 적지도 않는다. 개인 메일 주소를 파일·커밋에 적지 않는다. 강제 푸시 금지.
- 글 파일은 Write/Edit 도구로만 쓴다(UTF-8). 편집기를 여는 Git 명령은 쓰지 않는다(`-m`, `--no-edit`). Git 명령 앞에 `$env:GIT_TERMINAL_PROMPT='0'`.
- 10분 넘게 걸릴 수 있는 명령(`--wait`, 로그인 창이 뜰 수 있는 푸시)은 백그라운드로 돌리고 끝 알림을 기다린다.
- 사람 차례(로그인 창, Pages 켜기, 파일 공개 여부, 사이트 승인)에서는 할 일을 한 문장으로 알리고 턴을 끝내 답을 기다린다.
- 서브에이전트를 쓸 때는 Opus 5.5(`model: "opus"`), `effort: "high"`.

## 출발 전 (사람)

- [-] [사람] P01 (에이전트가 공유 아티팩트에서 앱 파일 30개를 받음) 앱 `recipe-maker/`의 내용물을 랄프톤 폴더 맨 위에 복사(`deploy-pages\`는 덮어쓰지 않음, `.git\`은 가능하면 빼고) — 확인: `랄프톤\index.html` 있음
- [x] [사람] P02 Git·Node.js LTS·GitHub CLI winget 설치 → 터미널과 Claude 새로 열기 → `gh auth login` → `gh auth setup-git` — 확인: `git --version`, `node --version`, `gh auth status`
- [x] [사람] P03 github.com/new에서 빈 Public 저장소 `recipe-maker` (README·.gitignore·license 끔) — 확인: `https://github.com/<아이디>/recipe-maker` 열림
- [x] [사람] P04 SPEC 0-1 표: 아이디 `ohjuan0204-maker`, 커밋 이름 `Mol-Loop`, Public `예` (noreply 메일은 `gh` 로그인 시 에이전트가 채움, 아니면 사람이 적음)

## 에이전트

- [x] T01 PG1 시작 상태: 폴더·git·node(18+)·`node --test` 건수·check_mw, PROGRESS "배포" 절 만들기, 시작·마감 시각 채우기, 0-1 아이디·메일 채우기(`gh api user`) — 확인: PG1
- [x] T02 PG2 공개 점검: 문서·이미지·비밀 파일, 열쇠 같은 글자, 학번 같은 숫자, (`.git`이 있으면) 과거 기록. 사이트·fixtures 밖의 것은 목록으로 사람에게 묻고 답을 기다림 — 확인: PG2
- [x] T03 PG8 확인 도구 `tools/check_pages.mjs` 만들기(SPEC 4장) + 도구 자체 점검(`--local --html tools/_tmp_check.html`로 틀린 경로 2개 잡기, 종료 코드 1, 임시 파일 지움) — 확인: PG8
- [x] T04 PG3 경로 점검: 스크립트 안 `fetch`/`Worker`/`import` 경로 grep, 한글 파일 이름, `node tools/check_pages.mjs --local`(목록: 폴더) — 확인: `경로 n개, 문제 0개`
- [x] T05 PG4 `.nojekyll`(빈 파일, `New-Item`)과 `.gitignore`(Write/Edit, T02에서 "아니오"인 파일 포함) — 확인: PG4 (`git check-ignore`·`--ignored`는 T06의 `git init` 뒤에 본다)
- [x] T06 PG5 `git init -b main`(또는 브랜치 확인), 이 저장소에만 user.name `Mol-Loop`·user.email(noreply)·core.quotepath false, `git add -A` → `git status --short --ignored` 재확인 → `git commit -m "배포 PG5: 1차 루프 끝 상태"` → `--local` 재실행(목록: git ls-files) — 확인: PG5, PG4, `문제 0개`
- [x] T07 PG6 `git remote add origin https://github.com/<아이디>/recipe-maker.git` → 푸시(`gh` 로그인 상태면 바로, 아니면 먼저 알리고 백그라운드) → 두 번째 `git push` — 확인: `Everything up-to-date`
- [x] T08 PG7 Pages 켜기: `gh api -X POST repos/<아이디>/recipe-maker/pages -f "source[branch]=main" -f "source[path]=/"`(409는 통과), `gh`가 안 되면 사람에게 부탁 — 확인: `gh api repos/<아이디>/recipe-maker/pages`의 `html_url`
- [x] T09 PG9 `node tools/check_pages.mjs <공개 주소> --wait 15`(백그라운드) → `git fetch origin`, `HEAD` = `origin/main` — 확인: `같음 n/n`, 종료 코드 0
- [x] T10 PG10 깊은 주소 `#solid`, `#waste`, 끝 `/` 없는 주소(처음 연 시각을 적어 둠) — 확인: PG10
- [!] T11 (1분 체험·글꼴 통과, 데모 1~8단계는 앱 SPEC.md가 없어 못 함) PG11 공개 주소에서 앱 SPEC.md 2장 데모 1~8단계, 1분 체험 7단계 → [끝내기] → 홈, 글꼴 200 (인쇄 창 금지, 자동 불가 단계는 `[-]` + PG13으로 넘김) — 확인: PG11, A18
- [x] T12 PG12 375px·320px × 홈·용액 조제·희석·레시피·폐액 가로 스크롤 없음, 콘솔 오류 0, 404 0, 너비 되돌리기 — 확인: PG12
- [x] T13 PG14 기록: SPEC 7-1 PG14 "기록할 곳" 1~5(없는 곳은 "없음"), 앱 TASKS.md 배포 줄 [x], 이 파일 표시 → `git commit -m "배포 PG14: 공개 주소 기록"` → 푸시 → `--wait 15`(백그라운드) — 확인: PG14
- [ ] [사람] T14 PG13 휴대폰(모바일 데이터·학교 와이파이, 아이폰 사파리·안드로이드 크롬)으로 [1분 체험] 1~2단계 + T11에서 넘긴 단계 — 확인: 사람이 말해 주면 PROGRESS에 받아 적음. 에이전트는 기다리지 않는다
- [x] T99 끝 확인: `node tools/check_pages.mjs <공개 주소>`(기다리기 없이) 같음 n/n·종료 코드 0, `HEAD` = `origin/main`, `node --test` PG1과 같은 건수, 공개 주소가 기록할 곳 모두에 같은 글자 → 짧은 보고 후 멈춤 — 확인: SPEC 14장

## 계획 B (T09 통과 전에 마감 시각이 지났을 때만)

- [ ] T98 그 자리에서 멈춤: PROGRESS에 막힌 단계·마지막 오류 글자·해 본 것, 커밋은 남김, `loop2/spec.md` 0장(있으면)에 `계획 B`, 사람에게 zip → claude.ai 아티팩트 안내 — 확인: SPEC 12장
