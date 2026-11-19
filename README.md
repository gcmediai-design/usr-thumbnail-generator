# 의사랑 기능 가이드 썸네일 생성기

GitBook 기능 가이드 카드에 넣을 커버 이미지(1600×900 PNG)를 같은 규칙으로 만드는 사내 도구입니다.

- 접속 주소: https://jay0479-design.github.io/ysr-thumbnail-generator/
- 설치할 것 없이 브라우저에서 바로 씁니다.
- `main` 브랜치에 push하면 1~2분 뒤 자동으로 다시 배포됩니다.

## 폴더 구조

```
index.html              화면 마크업
css/app.css             스타일
js/boot.js              data/*.json 을 읽고 앱을 시작
js/app.js               앱 로직 (렌더링·추천·저장)
js/vendor/jszip.min.js  ZIP 저장용 라이브러리
fonts/                  Pretendard, SUIT
data/
  assets.json           에셋(그림) 목록과 시리즈 이름
  categories.json       분류
  presets.json          기존 가이드 목록
  rules.json            그림 추천·허용 규칙
assets/images/{시리즈}/{id}.webp   그림 파일
tools/check-data.mjs    데이터 검사 스크립트
```

빌드 과정이 없습니다. 파일을 고치고 push하면 끝입니다.

## 자주 하는 작업

### 그림(에셋) 추가

1. 그림 파일을 `assets/images/{시리즈}/` 에 넣습니다. 투명 배경 WebP 또는 PNG, 긴 변 780px 안팎을 권장합니다.
2. `data/assets.json` 의 `assets` 에 한 줄을 추가합니다.

```json
{"id": "laptop_video", "series": "J", "name": "노트북 화상진료", "kw": "비대면진료, 화상, 원격", "src": "출처", "w": 780, "h": 640, "file": "assets/images/J/laptop_video.webp"}
```

| 항목 | 설명 |
|---|---|
| `id` | 영문 소문자·숫자·밑줄만. 다른 에셋과 겹치면 안 됩니다. 한번 정하면 바꾸지 않습니다(저장 내역이 id로 그림을 찾습니다). |
| `series` | `assets.json` 맨 위 `series` 목록의 키. 새 시리즈는 그 목록에 먼저 추가합니다. |
| `name`, `kw` | 화면에 보이는 이름과, 추천·검색에 쓰는 키워드(쉼표로 구분). |
| `src` | 원본 출처(스톡 ID, 제작 도구 등). 라이선스 확인용 기록입니다. |
| `w`, `h` | 그림 파일의 실제 가로·세로 픽셀. |
| `file` | 저장소 기준 그림 경로. |

선택 항목:

| 항목 | 설명 |
|---|---|
| `person`, `role` | 의료인 인물이면 `"person": true` 와 `rules.json` `roles` 의 키(`doctor` 등). 인물은 메인으로만 쓰이고 청구·보고 분류에는 나오지 않습니다. |
| `claimOk` | `true` 면 청구·보고 분류에서도 고를 수 있습니다. |
| `noPedestal`, `ax`, `plate` | 그림에 자체 바닥판이 있을 때. 받침대를 빼고 `ax`(판 중심의 가로 위치 0~1), `plate`(판 너비 비율)로 그림자를 맞춥니다. |
| `bleed` | `true` 면 그림을 화면 아래에 걸쳐 크게 배치합니다. |
| `graded` | 제작 기록용 표시. 앱 동작에는 쓰이지 않습니다. |

### 가이드 추가

`data/presets.json` 에 한 줄을 추가합니다. '기존 가이드 불러오기' 목록, 카드 미리보기, ZIP 저장에 자동으로 반영됩니다.

```json
{"file": "가이드-주소-마지막-부분", "title": "GitBook 카드 제목", "cat": "care", "main": "에셋 id", "sub": ""}
```

`scale`, `sscale`, `dx`, `dy`, `flip`, `ped`(`auto`·`on`·`off`)를 함께 적으면 그 가이드의 기본 조정값이 됩니다. `"default": true` 는 처음 열었을 때 보이는 가이드 한 곳에만 둡니다.

### 분류 추가

`data/categories.json` 에 한 줄을 추가합니다. `a`·`b` 는 배경 그라데이션, `accent` 는 배지 글자색입니다(흰 배경 대비 4.5:1 이상 권장).

```json
{"id": "reservation", "label": "예약·접수", "a": "#F4F1FD", "b": "#E1D9F8", "accent": "#6B4FD8", "desc": "예약, 접수, 대기 관리 기능"}
```

### 추천·허용 규칙

`data/rules.json`:

- `claimOk`: 청구·보고 분류에서 고를 수 있는 에셋
- `faceRobot`: 제목에 'AI'가 있을 때만 나오는 에셋
- `affinity`: 분류별로 추천 순위를 올려 주는 에셋
- `roles`: 의료인 직군과 키워드
- `styleRefs`: '새 그림 만들기 꿀팁'의 예시 이미지

하트·손 에셋(`heart_*_blue`, `heart_*_mint`)을 분류에 맞추는 규칙 등 나머지 로직은 `js/app.js` 의 `allowed()` 에 있습니다.

## push 전에 확인

```bash
node tools/check-data.mjs
```

id 중복, 없는 그림 파일, 잘못된 크기, 등록되지 않은 파일, 없는 에셋을 가리키는 가이드·규칙을 찾아 줍니다.

로컬에서 화면을 보려면 서버로 열어야 합니다(`index.html` 을 더블클릭하면 데이터를 읽지 못합니다).

```bash
python3 -m http.server 8000
```

그다음 http://localhost:8000 을 엽니다.

## 알아둘 점

- 화면에서 하는 '그림 직접 추가', '분류 직접 만들기', '저장 내역', 가이드별 조정값은 **각자 브라우저에만** 저장됩니다. 모든 직원이 함께 쓸 그림·분류·가이드는 위 방법으로 저장소에 추가합니다.
- 이 저장소와 사이트는 공개 상태입니다. 주소를 아는 사람은 누구나 열 수 있고, 그림 원본도 내려받을 수 있습니다.
- 한 파일로 되어 있던 처음 버전은 `v0-single-file` 태그에 남아 있습니다.
