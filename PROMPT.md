# PROMPT — 이 폴더에서 쓴 프롬프트 기록 (제출 묶음, 규칙 ⑥)

## 1차 런 프롬프트

```
ultracode

이 폴더는 대회 컴퓨터의 랄프톤 폴더이고 '용액 레시피 메이커'(정적 HTML/CSS/JS 웹앱)가 들어 있다. 지금은 1차 랄프 런(19:50~20:20)이다.
사람은 이 런 동안 노트북을 만질 수 없다(가재탈 룰). 사람에게 묻고 기다리지 않는다. 사람이 필요한 일은 [!]와 사유를 적고 다음 일로 넘어간다.

## 이 런에서 할 일 (이 순서)
A. 첫 배포: deploy/spec.md PG1~PG9 (deploy/prompt.md [배포 프롬프트]의 1)~8)).
B. loop2/spec.md 2-1장 1순위: F02·F05 → F20 → F26 (loop2/prompt.md [2차 프롬프트]의 규칙·레인·항목별 주의를 그대로 따른다).
C. 시간이 남으면 레인 A(F24 → F23)를 병렬로 시작해 둔다. 화면 연결과 나머지 항목은 2차 런에서 한다.

## 먼저 읽을 것 (5분 안에)
deploy/spec.md 0·0-1·3·4·5·6장, loop2/spec.md 0·2-1·3·4장의 F02·F05·F20·F26, loop2/prompt.md [2차 프롬프트]의 '반드시 지킬 것'·'작업 방식'·'항목별 주의',
SPEC.md 6·8장, TASKS.md "fix_plan 반영" 절, 진행 로그(PROGRESS.md 또는 progress.txt) 맨 끝, FIX 로그.

## 사람 없이 끝내기 위한 규칙
- 시각을 자주 본다(Git Bash: date +%H:%M, PowerShell: Get-Date -Format HH:mm). 20:12부터는 새 항목을 시작하지 않고 마무리로 간다. 20:18에 보고하고 멈춘다.
- git 명령은 로그인 창이 뜨지 않게 GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never 를 붙여 실행한다(예: GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git push -u origin main).
  인증 때문에 실패하면 되풀이하지 않는다. 커밋은 남기고 배포 항목을 [!](사유: 로그인 필요 — 중간 점검에 사람이 gh auth login)로 적고 B로 간다.
- Pages 켜기는 gh auth status가 로그인 상태일 때만 gh api로 한다. 아니면 [!](사유: 중간 점검에 사람이 Settings → Pages) 후 B로 간다.
- 공개하면 안 될 수 있는 문서(.hwp/.hwpx/.pdf/.docx/.xlsx 등, tests/fixtures 밖)와 열쇠처럼 보이는 글자가 나오면 묻지 않고 커밋에서 뺀다(.gitignore). 뺀 목록을 진행 로그에 적는다.
- 체험 완료 코드가 deploy/spec.md 0장에 있고 앱에서 빈칸·미정으로 보이면 그 코드로 바꾼다(node --test). 0장도 비어 있으면 바꾸지 않고 [!](사유: 코드 미정, 체험 투표에 필요).
- 고정 사실을 바꿔야 하는 일이 생기면 [!]와 선택지 2개·추천을 진행 로그에 적고 다음 항목으로 간다.
- 공개 주소가 반영되기를 기다리는 동안 멈춰 있지 않는다. B를 하다가 1분 넘게 간격을 두고 다시 확인한다.
- 앱 기능은 loop2/spec.md에 적힌 것만 바꾼다. 외부 API·라이브러리·글꼴 금지, 일반 <script>, 상대 경로, 인쇄 창 금지, 작업 폴더를 옮기지 않는다.
- 이미 있는 파일은 Edit으로만 고친다. 레인별 테스트 파일은 loop2/prompt.md에 적힌 대로(EA/EB/EC/EM.part.js), tests/fixplan.test.js에 불러오는 줄은 메인만.
- 모든 숫자는 Python(python -I)이나 Node로 다시 계산해 확인한다.

## 순서
0) (3분) 시작 시각, 폴더 경로, node --test 건수, git status, gh auth status를 진행 로그에 "## 1차 런 (19:50~20:20)" 절로 적는다.
   이 프롬프트 전문을 PROMPT.md 맨 끝에 "## 1차 런 프롬프트"로 붙인다(제출 묶음, 규칙 ⑥).
1) 레인을 띄운다(서브에이전트, 파일이 겹치지 않게): 레인 C(calc.js SAMPLE과 흡광도 샘플 데이터: F02·F05 계산 쪽), 레인 B(experiments.js: F20 기호 데이터),
   레인 A(labcalc.js·theory.js: F24 → F23). 레인마다 '이 일을 하지 않은 검증 에이전트'가 Python으로 다시 계산해 반박을 시도한다.
2) 메인은 그동안 A(배포): PG1 → PG2 → PG4(.nojekyll) → PG5 첫 커밋 → PG6 첫 푸시 → PG7 Pages → PG3·PG8(check_pages.mjs) → PG9 반영 확인.
3) 메인 합치기(loop2/spec.md 2-1장 순서): F02·F05(버튼 [샘플: 흡광도 실험], 1분 체험, 예상 흡광도 옆 가정 문구, 100 mg/L 원액 안내) → F20(실험 목록 카드와 홈 '오늘의 실험' 카드) → F26.
   항목마다: 테스트 먼저(실패 확인) → 고침 → Python 재계산 → node --test 전체 → 진행 로그에 증거 → TASKS.md [x] → 커밋(메시지에 F번호) → 푸시.
4) 20:12부터 마무리: node --test 전체, 공개 주소가 떴으면 node tools/check_pages.mjs <공개 주소> 와 공개 주소에서 데모 1~8단계·체험 완료 코드 확인(아니면 로컬 하위 주소에서),
   375px 가로 스크롤과 콘솔 오류, 진행 로그·FIX 로그(실패한 것과 고친 방법)·TASKS.md 정리, 커밋·푸시. 레인 A가 덜 끝났으면 그 상태를 적고 둔다(2차에서 잇는다).
5) 20:18 보고(진행 로그와 화면에 같은 내용, 짧게): 공개 주소와 check_pages 결과, 끝낸 F번호, [!] 항목과 사람이 중간 점검에 할 일(목록), 레인 A 진행 상태,
   node --test 건수, 사람을 부를 뻔한 일. 그다음 멈춘다.
```
