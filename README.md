# Anoko Checklist

도화지 위에 볼록한 에폭시 스티커를 붙이며 완료를 기록하는 체크리스트 웹 앱.

- **Stack**: Vite + React 19 + TypeScript, Tailwind CSS v4, Framer Motion, Web Audio API
- **Font**: 전역 `Helvetica, Arial, sans-serif` 고정 (`src/index.css`)
- **Palette**: 화이트 · 오트밀 · 베이지 · 세이지 그린 (`@theme` 토큰: `paper`, `sheet`, `oat`, `beige`, `line`, `ink`, `sage` …) + 은은한 종이 결 텍스처

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 타입체크 + 프로덕션 빌드
npm test           # vitest 단위 테스트
```

## 화면 구성

1. **스티커 판** — 종류마다 같은 스티커 4장. 완료할 때마다 선택된 종류의 오른쪽 끝 장부터 떼어지고,
   떼어낸 자리엔 뒷지 자국이 남습니다. 한 종류를 다 쓰면 다음 종류로 자동 전환되고, 다 쓴 종류에는
   새로고침 버튼이 떠서 누르면 다시 4장이 채워집니다. 끝의 `+`로 이미지를 올려 새 종류를 추가할 수 있습니다.
2. **게이지 바** — 글이 적힌 할 일 중 완료 비율 (텍스트 없음).
3. **할 일 판** — 기본 빈 칸 5개. 칸을 눌러 바로 쓰고(Enter/바깥 클릭으로 저장, × 로 칸 삭제),
   아래 `+`로 칸을 늘립니다. 오른쪽 점선 원을 누르면 스티커가 붙습니다(빈 칸은 완료 불가).

## 구조

```
src/
├─ App.tsx                    # 레이아웃, 스티커 떼기·붙이기 오케스트레이션
├─ index.css                  # 전역 폰트, 팔레트 토큰, 종이 텍스처, 스티커 스타일
├─ audio/SoundManager.ts      # Web Audio 합성 효과음
├─ assets/stickers/           # 기본 스티커: 배경 제거 아트 + 재단 모양(-shape) PNG
├─ components/
│  ├─ StickerSheet.tsx        # 스티커 판 (재고, 뒷지 자국, 새로고침, 업로드)
│  ├─ ChecklistItem.tsx       # 할 일 한 줄: 윤곽선 없는 둥근 칸 + 스티커 자리
│  ├─ DomeSticker.tsx         # 외곽선대로 재단된 볼록 에폭시 스티커 렌더링
│  ├─ Sketch.tsx              # 연필로 그린 듯한 점선 윤곽선 (SVG pencil 필터 + SketchBorder)
│  └─ StickerOverlay.tsx      # 스티커 판 → 가까이 → 완료 칸으로 날아가는 애니메이션
├─ hooks/useChecklist.ts      # reducer + localStorage 영속화
└─ lib/
   ├─ checklistReducer.ts     # 칸 추가/삭제/입력, 완료(재고 차감), 새로고침 (단위 테스트 포함)
   ├─ defaultStickers.ts      # 기본 제공 캐릭터 스티커 2종
   ├─ imageToSticker.ts       # 업로드 이미지 → 단색 배경 제거 + 재단 모양 생성
   └─ storage.ts
```

## 스케치북 윤곽선 (`SketchBorder`)

카드·입력창·버튼·완료 자리의 윤곽선은 CSS border 대신 SVG 점선을 쓰고, 공용 `#pencil` 필터로
선을 살짝 흔들고(feDisplacementMap) 흑연 입자처럼 끊어(노이즈 마스크) 연필로 그린 느낌을 냅니다.
할 일 칸 자체는 윤곽선 없는 둥근 사각형이고, 스티커가 붙을 자리만 연필 점선 원으로 표시됩니다.

## 볼록 스티커 (`DomeSticker`)

스티커마다 모양이 다르도록, 아트의 알파(외곽선)를 넓혀 만든 **재단 모양(shape)** 을 기준으로 그립니다.

1. **레진층**: 재단 모양을 우윳빛 흰색으로 — 아트 주변의 투명 레진 테두리
2. **아트**: 배경이 제거된 그림 (살짝 투명)
3. **돔 조명층**: 재단 모양을 흐리게 한 값을 높이맵으로 삼는 SVG 조명 필터
   (`feSpecularLighting` 광택 + 점광원 반짝임 + 우하단 두께 음영) → 외곽선을 따라 볼록해 보임
4. 바깥 `drop-shadow`도 재단 모양을 따라 떨어짐

스티커별 `gloss` 값으로 광택 세기를 조절합니다 (뿔이는 0.6).

업로드한 이미지는 테두리가 단색(흰/검정 등)이면 그 배경을 flood-fill로 지우고,
남은 그림의 외곽선을 따라 재단 모양을 만듭니다. 배경이 복잡한 사진은 그대로 둡니다.

## 완료 연출

완료 칸 클릭 → 스티커가 스티커 판에서 '수웅' 튀어나와 화면 가까이(크게) 다가왔다가, 멈추지 않고
곧바로 '수웅' 멀어지며 완료 칸에 붙음 (착지 시 눌림 + 광택 sweep) + 효과음 + 살짝 화면 흔들림.
스티커 판이 화면 밖에 있으면 완료 칸에서 바로 튀어오릅니다.
`prefers-reduced-motion` 사용 시 애니메이션 없이 바로 붙습니다. 우측 상단 버튼으로 음소거할 수 있습니다.
