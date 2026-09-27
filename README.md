# 3D Memory Room (기억의 다락방) 🕯️

> 따뜻한 노을빛 다락방에서 소중한 추억을 1인칭으로 거닐며 감상하는 감성 3D 사진 앨범 웹사이트

![Memory Room](https://img.shields.io/badge/Three.js-0.160+-orange.svg)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## ✨ Features (주요 기능)

- 🌅 **감성 3D 다락방 공간 (Atmospheric 3D Attic)**
  - 절차적 캔버스 원목 바닥 및 천장 서까래
  - 창밖으로 펼쳐지는 노을(골든 아워) 하늘
  - 부유하는 400개의 따뜻한 황금빛 먼지 파티클
  - 부드러운 웜톤 조명 및 은은하게 반짝이는 36구 페어리 스트링 조명
  - 외부 대용량 3D 에셋 없이 순수 WebGL/Three.js로 즉각 로딩

- 🚶 **1인칭 탐색 (First-Person Navigation)**
  - 마우스 시점 전환 (`PointerLockControls`)
  - `W`, `A`, `S`, `D` / 화살표 키 부드러운 보행 이동 (지수 감쇠 보간)
  - 방 벽면 충돌 경계 제한
  - 모바일 터치 시야 회전 및 온스크린 가상 조이스틱 완벽 지원

- 🖼️ **3D 액자 및 레이캐스팅 상호작용 (Interactive Frames)**
  - 다락방 벽면에 자연스럽게 걸린 8개의 감성 액자
  - 시선이 액자에 닿으면 부드러운 골든 하이라이트 글로우 활성화
  - `[E]` 키, `Enter` 키, 마우스 클릭 또는 모바일 터치로 기억 열람

- 💌 **폴라로이드 상세 뷰 (Polaroid Modal)**
  - 아날로그 감성의 폴라로이드 카드와 마스킹 테이프 그래픽
  - 감성 손글씨 폰트(Caveat, Gowun Batang), 날짜, 사연 본문
  - 이전/다음 기억 순환 탐색 (`←`, `→` 키보드 지원) 및 ESC 닫기

- ✍️ **브라우저 내 실시간 사진 관리 (Live Photo Manager)**
  - 드래그 앤 드롭 및 파일 업로드 지원
  - Canvas 기반 클라이언트 자동 이미지 최적화 압축 (최대 1200px, JPEG 80%)
  - 제목, 날짜, 사연 실시간 편집
  - `localStorage` 영구 보관으로 새로고침해도 유지
  - 저장 즉시 3D 방 안의 액자 텍스처가 실시간으로 변경 (새로고침 불필요)
  - 기본 프리셋 복원 및 JSON 백업 내보내기/가져오기 지원

- 🎹 **오프라인 앰비언트 사운드트랙 (Web Audio API Synthesizer)**
  - 외부 mp3 파일 없이 Web Audio API로 실시간 합성되는 잔잔한 피아노 코드 진행 (`Cmaj7` - `Am9` - `Fmaj7` - `G7sus4`)
  - 빈티지 로우패스 필터로 따뜻하고 아늑한 질감
  - 폴라로이드 종이 넘김 소리 및 벨 차임 효과음
  - 상단 HUD 볼륨 슬라이더 및 음소거 토글 버튼

---

## 🚀 Quick Start (실행 방법)

### 설치
```bash
git clone https://github.com/gilsy02/Memory-Room-3D.git
cd Memory-Room-3D
npm install
```

### 로컬 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173/` 접속.

### 프로덕션 빌드
```bash
npm run build
npm run preview
```

### 테스트 실행
```bash
node tests/test-e2e-integration.mjs
```

---

## 🛠️ Tech Stack (기술 스택)

- **Engine:** Three.js (r160)
- **Bundler:** Vite
- **Styling:** Tailwind CSS + Custom CSS (Google Fonts: Caveat, Gowun Batang)
- **Audio:** Web Audio API (Procedural Synthesizer)
- **Storage:** LocalStorage + HTML5 Canvas Compression

---

## 📄 License

MIT License
