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

## 구조

```
src/
├─ App.tsx                    # 상태 조립, 완료 연출(사운드·화면 흔들림) 오케스트레이션
├─ index.css                  # 전역 폰트, 팔레트 토큰, 종이(.paper) / 스티커(.dome-sticker) 스타일
├─ audio/SoundManager.ts      # Web Audio 합성 효과음 (완료음, 스티커 '착' 소리, UI 틱)
├─ assets/stickers/           # 기본 스티커: 배경 제거 아트 + 재단 모양(-shape) PNG
├─ components/
│  ├─ ChecklistInput.tsx      # 항목 입력 + 스티커 선택
│  ├─ ChecklistItem.tsx       # 좌측 텍스트/수정/삭제 + 우측 완료 칸
│  ├─ StickerPicker.tsx       # 기본 스티커 + 이미지 업로드 / 삭제
│  ├─ DomeSticker.tsx         # 외곽선대로 재단된 볼록 에폭시 스티커 렌더링
│  └─ StickerOverlay.tsx      # 완료 시 '수웅' 다가왔다가 칸에 붙는 애니메이션
├─ hooks/useChecklist.ts      # reducer + localStorage 영속화
└─ lib/
   ├─ checklistReducer.ts     # 추가/삭제/수정/완료/스티커 관리 (단위 테스트 포함)
   ├─ defaultStickers.ts      # 기본 제공 캐릭터 스티커 2종
   ├─ imageToSticker.ts       # 업로드 이미지 → 단색 배경 제거 + 재단 모양 생성
   └─ storage.ts
```

## 볼록 스티커 (`DomeSticker`)

스티커마다 모양이 다르도록, 아트의 알파(외곽선)를 넓혀 만든 **재단 모양(shape)** 을 기준으로 그립니다.

1. **레진층**: 재단 모양을 우윳빛 흰색으로 — 아트 주변의 투명 레진 테두리
2. **아트**: 배경이 제거된 그림 (살짝 투명)
3. **돔 조명층**: 재단 모양을 흐리게 한 값을 높이맵으로 삼는 SVG 조명 필터
   (`feSpecularLighting` 광택 + 점광원 반짝임 + 우하단 두께 음영) → 외곽선을 따라 볼록해 보임
4. 바깥 `drop-shadow`도 재단 모양을 따라 떨어짐

업로드한 이미지는 테두리가 단색(흰/검정 등)이면 그 배경을 flood-fill로 지우고,
남은 그림의 외곽선을 따라 재단 모양을 만듭니다. 배경이 복잡한 사진은 그대로 둡니다.

## 완료 연출

완료 칸 클릭 → 스티커가 칸 바로 위에서 '수웅' 커지며 다가왔다가 곧바로 '수웅' 멀어져 칸에 붙음
(착지 시 눌림 + 광택 sweep) + 효과음 + 살짝 화면 흔들림.
`prefers-reduced-motion` 사용 시 애니메이션 없이 바로 붙습니다. 우측 상단 버튼으로 음소거할 수 있습니다.
