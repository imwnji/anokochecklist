# Anoko Checklist

3D 글래스 스티커로 완료를 "요란하게" 축하하는 체크리스트 웹 앱.

- **Stack**: Vite + React 19 + TypeScript, Tailwind CSS v4, Framer Motion, canvas-confetti, Web Audio API
- **Font**: 전역 `Helvetica, Arial, sans-serif` 고정 (`src/index.css`)

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
├─ App.tsx                    # 상태 조립, 완료 연출(사운드·confetti·화면 흔들림) 오케스트레이션
├─ index.css                  # 전역 폰트, glass-panel / glass-sticker 스타일
├─ audio/SoundManager.ts      # Web Audio 합성 효과음 (축하 팡파르, 스티커 '착' 소리, UI 틱)
├─ components/
│  ├─ ChecklistInput.tsx      # 좌측 상단: 항목 입력 + 스티커 선택
│  ├─ ChecklistItem.tsx       # 좌측 텍스트/수정/삭제 + 우측 완료 칸
│  ├─ StickerPicker.tsx       # 기본 스티커 + 이미지 업로드 / 삭제
│  ├─ GlassSticker.tsx        # 이미지를 3D 볼록 투명 스티커로 렌더링
│  └─ StickerOverlay.tsx      # 화면 중앙으로 튀어나왔다가 완료 칸에 붙는 애니메이션
├─ hooks/useChecklist.ts      # reducer + localStorage 영속화
└─ lib/
   ├─ checklistReducer.ts     # 추가/삭제/수정/완료/스티커 관리 (단위 테스트 포함)
   ├─ defaultStickers.ts      # 기본 제공 SVG 스티커 6종
   ├─ imageToSticker.ts       # 업로드 이미지 정사각 크롭 + 320px 축소(WebP)
   ├─ celebrate.ts            # confetti 폭발 프리셋
   └─ storage.ts
```

## 3D 글래스 스티커 (`.glass-sticker`)

1. 배경: `backdrop-filter: blur() saturate()` 프로스티드 글래스
2. 이미지: 약간 투명 + 확대(렌즈 효과)
3. `::before`: 좌상단 밝음 / 우하단 어두움 radial gradient → 볼록(bulge) 음영
4. `::after`: 상단 글로시 하이라이트
5. inset box-shadow(베벨/엠보스) + outer drop shadow(떠 있는 느낌)

## 완료 연출

완료 칸 클릭 → 스티커가 화면 중앙에서 elastic spring으로 크게 튀어나옴(회전 광선, 충격파 링,
`COMPLETE!`) + confetti 폭발 + 팡파르 → 완료 칸으로 날아가 '착' 붙으며(squash, 광택 sweep)
작은 confetti + 효과음 + 화면 흔들림. `prefers-reduced-motion` 사용 시 연출을 축소합니다.
우측 상단 🔊 버튼으로 음소거할 수 있습니다.
