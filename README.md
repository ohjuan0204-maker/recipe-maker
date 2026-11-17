# 용액 레시피 메이커

공개 주소: https://ohjuan0204-maker.github.io/recipe-maker/

화학 실험 준비용 계산기와 실험 자료를 담은 정적 웹앱이다(2026 루프랩 랄프톤 출품작). 빌드 단계가 없고, 이 폴더 그대로가 사이트다.

- 열기: 위 공개 주소를 브라우저에서 연다(로그인 없음). 내 컴퓨터에서는 `index.html`을 연다.
- 배포: `main` 브랜치에 푸시하면 GitHub Pages가 몇 분 안에 새 내용을 내보낸다.
- 배포 확인: `node tools/check_pages.mjs https://ohjuan0204-maker.github.io/recipe-maker/` → `같음 n/n`
- 경로 점검: `node tools/check_pages.mjs --local` → `문제 0개`
- 배포 명세와 작업 목록: `deploy-pages/SPEC.md`, `deploy-pages/TASKS.md`
- 진행 기록: `PROGRESS.md` · 쓴 프롬프트: `PROMPT.md`
- 글꼴 라이선스: `fonts/LICENSE.txt` (SIL Open Font License 1.1)
