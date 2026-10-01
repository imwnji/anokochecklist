# Anoko Checklist

도화지 위에 볼록한 에폭시 스티커를 붙이며 완료를 기록하는 체크리스트 웹 앱.

- **Stack**: Vite + React 19 + TypeScript, Tailwind CSS v4, Framer Motion, Web Audio API
- **Font**: 그리운 하제체 (라이선스 파일이라 **저장소에 포함하지 않음**). 실행 시 `src/lib/loadFont.ts`가 불러옵니다:
  `VITE_FONT_URL` 환경변수(라이선스 받은 웹폰트 주소)가 있으면 그것을, 없으면 git에 올라가지 않는
  `public/fonts/Griun_HajeFont-Rg.ttf`를 사용합니다. 파일이 없으면 Helvetica/Arial로 표시됩니다.
- **Palette**: 화이트 · 오트밀 · 베이지 · 세이지 그린 (`@theme` 토큰: `paper`, `sheet`, `oat`, `beige`, `line`, `ink`, `sage` …) + 은은한 종이 결 텍스처

## 미디어·폰트 (저장소에 없음)

스티커 이미지, 효과음, 영상, 폰트는 저작권 자료라 **git에 올라가지 않습니다** (`.gitignore`).
각자 로컬에 아래처럼 두고 혼자 쓰는 용도입니다. 없으면 스티커·소리·영상이 비어 보이고 폰트는 Helvetica/Arial로 나옵니다.

```
public/
├─ fonts/Griun_HajeFont-Rg.ttf
└─ media/
   ├─ stickers/  sticker-fluffy.png  sticker-fluffy-shape.png  sticker-horn.png  sticker-horn-shape.png
   ├─ sounds/    after-fluffy.mp3  after-horn.mp3
   └─ videos/    after-fluffy.mp4  after-fluffy.webm  after-horn.mp4  after-horn.webm
```

`npm run build` 시 이 폴더들이 `dist/`에 그대로 복사되므로, 빌드 결과물도 개인적으로만 사용하세요.
영상은 원본에서 소리를 빼고 가로 640px로 줄인 것입니다:
`ffmpeg -i 원본 -vf fps=30,scale=640:-2 -an -c:v libx264 -crf 23 -pix_fmt yuv420p -movflags +faststart after-xxx.mp4` (WebM은 `-c:v libvpx-vp9 -b:v 0 -crf 36`).

## 실행

```bash
npm install
# (선택) 폰트: public/fonts/Griun_HajeFont-Rg.ttf 에 직접 복사
npm run dev        # 개발 서버
npm run build      # 타입체크 + 프로덕션 빌드
npm test           # vitest 단위 테스트
```

## 화면 구성

1. **스티커 판** — 종류마다 같은 스티커 4장 (붙은 스티커와 같은 크기). 완료할 때마다 선택된 종류의 왼쪽 끝 장부터 (왼쪽 모서리가 들리며) 떼어지고,
   떼어낸 자리엔 뒷지 자국이 남습니다. 한 종류를 다 쓰면 다음 종류로 자동 전환되고, 다 쓴 종류에는
   새로고침 버튼이 떠서 누르면 다시 4장이 채워집니다. 끝의 `+`로 이미지를 올려 새 종류를 추가할 수 있습니다.
2. **게이지 바** — 글이 적힌 할 일 중 완료 비율 (텍스트 없음).
3. **할 일 판** — 기본 빈 칸 5개. 칸을 눌러 바로 쓰고(Enter → 저장 후 아래 빈 칸으로 이동, 바깥 클릭 → 저장, × → 칸 삭제),
   아래 `+`로 칸을 늘립니다. 오른쪽 점선 원을 누르면 스티커가 붙습니다(빈 칸은 완료 불가).

## 구조

```
src/
├─ App.tsx                    # 레이아웃, 스티커 떼기·붙이기 오케스트레이션
├─ index.css                  # 전역 폰트, 팔레트 토큰, 종이 텍스처, 스티커 스타일
├─ audio/SoundManager.ts      # Web Audio 합성 효과음
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

## 개체 가장자리 (`EDGE_STYLE`)

`src/components/Sketch.tsx`의 `EDGE_STYLE` 한 줄로 전환합니다.

- `'paper'` (현재): 윤곽선 없이, 판·게이지·버튼·스티커 자리·할 일 칸의 가장자리가 `#paper-edge` 필터
  (미세한 섬유 노이즈 + 살짝 흐림)로 종이 오린 것처럼 부드럽게 사라짐. 배경만 `Surface` 레이어로 그려서
  글자와 스티커는 또렷하게 유지.
- `'pencil'`: 이전의 연필 점선 윤곽선(`SketchBorder`)으로 되돌아감.

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

## 완료 연출 · 소리

완료 칸 클릭 → 스티커 판의 왼쪽 끝 장이 모서리부터 들리며 떼어져 화면 가까이 '수웅' 다가왔다가,
멈추지 않고 곧바로 '수웅' 멀어지며 완료 칸에 붙습니다 (착지 시 눌림 + 광택 sweep).

소리 (`src/audio/SoundManager.ts`, 효과음은 모두 Web Audio로 매번 조금씩 다르게 합성):

1. **떼기** — 접착면이 떨어지는 미세한 크래클이 좌우로 흩어지며 점점 빨라지다 '톡' 하고 떨어짐
2. **붙이기** — 아주 작고 귀여운 '뽁' (위로 튀는 짧은 방울 소리)
3. **이어서** 스티커 종류별 소리(`public/media/sounds/after-*.mp3`)가 흘러나옴 (복슬이는 페이드인 없이 바로, 뿔이는 잔잔하게 페이드인).
   두 파일은 −20 LUFS로 음량을 맞췄고, 새 스티커가 붙으면 이전 소리는 부드럽게 사라집니다.

붙인 직후에는 스티커 종류별 영상(`public/media/videos/after-*`)이 화면 가운데에 살짝 투명하게 떠서 재생되고,
끝나면(또는 누르면) 사라집니다. 배경은 그대로 두고 네 가장자리만 마스크로 부드럽게 투명해지게 해서
종이 위에 자연스럽게 떠오르도록 했습니다 (H.264 MP4, 미지원 브라우저는 VP9 WebM). 소리는 효과음 클립이
담당하므로 영상은 무음입니다.

완료를 취소하면 할 일에서 스티커를 떼는 작은 떼기 소리가 납니다. 그 외 버튼에는 소리가 없습니다.
`prefers-reduced-motion` 사용 시 애니메이션 없이 바로 붙습니다. 오른쪽 위 버튼으로 음소거할 수 있습니다.
