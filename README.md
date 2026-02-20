# pdf-sign

백엔드 없이 브라우저(JavaScript)에서 PDF에 서명 이미지를 합성하는 샘플입니다.

## 기능
- PDF + 서명 이미지 각각 **파일 업로드** 또는 **URL 입력** 방식 지원
- `[서명] PDF 생성` 버튼 클릭 시 새 PDF(`signed.pdf`) 다운로드
- `보험모집인 : 조정국 (서명/인)` 텍스트를 PDF에서 탐색해 해당 영역 주변에 서명 자동 배치
- 필요 시 너비 / X,Y 오프셋으로 미세 조정

## 로컬 실행
이 프로젝트는 정적 파일 앱이라 **빌드/백엔드 없이 실행**됩니다.

```bash
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173` 접속 후 사용하세요.

> `index.html` 파일을 더블클릭해서 여는 방식(`file://`)은 라이브러리 로딩/브라우저 보안정책 때문에 문제가 생길 수 있어,
> 위처럼 간단한 HTTP 서버 실행 방식을 권장합니다.

## 서비스 배포 방법
정적 사이트 호스팅에 그대로 올리면 됩니다. (예: GitHub Pages, Netlify, Vercel)

### 1) GitHub Pages
1. 이 저장소를 GitHub에 push
2. GitHub 저장소 `Settings` → `Pages`
3. `Build and deployment`에서 `Deploy from a branch` 선택
4. 브랜치 `main` / 폴더 `/ (root)` 선택 후 저장
5. 수 분 후 `https://<계정>.github.io/pdf-sign/` 형태로 접속

### 2) Netlify / Vercel
- 새 프로젝트 import 후, 별도 빌드 명령 없이 루트 정적 파일을 배포하면 됩니다.
- Build command: 비움
- Output directory: 비움(루트)

## GitHub push 방법
원격 저장소: `https://github.com/nivalcar/pdf-sign.git`

```bash
# 원격 저장소 연결(최초 1회)
git remote add origin https://github.com/nivalcar/pdf-sign.git

# 기본 브랜치 이름 설정 (필요 시)
git branch -M main

# 푸시
git push -u origin main
```

이미 `origin`이 있으면 URL만 갱신:

```bash
git remote set-url origin https://github.com/nivalcar/pdf-sign.git
git push -u origin main
```

## 파일 구성
- `index.html`: UI
- `styles.css`: 스타일
- `app.js`: PDF/이미지 로드, 텍스트 좌표 탐색, 서명 합성 및 다운로드

## 참고
- URL 입력은 대상 서버의 CORS 정책에 따라 브라우저에서 차단될 수 있습니다.
- 현재는 전달 주신 첨부 PDF 타입 기준으로 동작하도록 구현했습니다.
