# 김밴던을 찾아라 🐈‍⬛

HTML5 + CSS3 + Vanilla JS 로 만든 9:16 세로형 모바일 웹 게임. 빌드 도구 없이 `index.html` 을 바로 열면 실행됩니다.

## 구조
```
index.html   진입점
style.css    파스텔 UI 스타일
game.js      씬 상태(currentScene)와 모든 게임 로직
assets/      이미지
```

## 씬 흐름
Scene0 타이틀 → Scene1 숨은 밴던이 찾기(10마리) → Scene2 러너(실패 시 대기화면으로 무한 재도전)
→ Scene3 컷씬 3장 → Scene4 프로포즈(예/아니오) → Scene4-1 선물(반지/왁뿌) → Scene5 엔딩(다시 플레이)

## 에셋
| 파일 | 용도 | 상태 |
|---|---|---|
| `assets/village.jpg` | 숨은그림찾기 마을 | 포함 |
| `assets/cat-photo.png` | 10마리 모두 찾았을 때 날아오는 밴던이 사진 | 포함 |
| `assets/1.png` `2.png` `3.png` | 컷씬 | 포함 |
| `assets/title.jpg` | 타이틀 배경 | 포함 |
| `assets/ending-wedding.png` | 엔딩 웨딩 사진 | 포함 |
| `assets/ending-cat.png` | 엔딩 프로포즈 고양이 사진 | 포함 |
| `assets/runner.png` | (선택) 러너 캐릭터 스프라이트 | 없음 → 캔버스로 직접 그림 |

이미지가 없으면 파스텔 도형/이모지로 대신 보여줘요. 없는 파일을 같은 이름으로 `assets/` 에 넣으면 자동으로 적용됩니다.
숨은 밴던이 좌표는 `game.js` 의 `CAT_SPOTS`, 게임 문구는 `TEXT` 에서 수정할 수 있어요.
