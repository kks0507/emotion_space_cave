# 마음동굴 (emotion_space_cave)

문학작품 낭송 데이터(AI Hub 158)를 활용해, 이용자가 털어놓은 마음을 감정 분석한 뒤
맥락에 맞는 문학 문장 1개를 골라 **디지털 카드 + 2문장 편지**로 돌려주는 서비스.
컨셉은 **"대나무 숲 / 동굴"** — 위로뿐 아니라 축하·격려·자랑 들어주기까지.

> 표면은 위로 카드, 진짜 목적은 **학생 정서 추적 → 학업중단(자퇴·휴학) 예방 → 학적 유지**.

기획·결정의 단일 진실 공급원은 [`docs/HANDOVER.md`](docs/HANDOVER.md).

## 아키텍처 (모듈화 원칙)

공통 파이프라인은 **최대한 공유**, 초등생/대학생이 **반드시 갈라져야 하는 부분만 분기**.

```
app/
  page.tsx            랜딩(두 동굴 입구)
  child/ adult/       두 서비스 진입점 (DB·로직 공유, 프로필만 다름)
  api/respond/        공통 진입 엔드포인트
lib/
  pipeline/           ★ 공유 5단계: analyze → rubric → retrieve(queries) → select → compose
  audience/           ★ 유일한 분기점: child.ts / adult.ts (톤·어휘·UX카피·카드테마)
  db/                 Turso 클라이언트 + 후보 추출 쿼리
  llm/                Claude 계층(키 없으면 사전 폴백)
  lexicon/            부정어/위기어 사전(하이브리드 1차 점수)
  types.ts            공유 도메인 타입
```

핵심: 파이프라인 함수는 `AudienceProfile`을 **주입받아** 동작 → 로직 중복 0.

## 5단계 파이프라인

1. 입력(이름·나이·마음) — 로그인 없음
2. 감정 분석 — 하이브리드(부정어 사전 + LLM). "부정어가 얼마나 많은가" 척도
3. 루브릭(D14) — 위기 강도 = max(부정정서강도, 이탈의사구체성), 0~4단계(MTSS)
4. 후보 추출 + 선별(RAG) — 감정 라벨 필터 + 품질(동의율≥0.8) → 맥락 적합 1문장
5. 카드 문구 + 2문장 편지 — audience 페르소나 톤

매칭 방향(D13): 평상~경미=공감(메아리), 경계~위기=전환+위기상담 안내.

## 개발

```bash
cp .env.example .env   # 값 채우기
npm install
npm run dev            # http://localhost:3000
```

## 데이터 적재 (1회)

```bash
python3 scripts/load.py   # AI Hub 라벨 JSON → Turso (work/sentence/label/sentence_label)
```

원천 데이터는 `data_raw/`(gitignore). 스키마는 `docs/HANDOVER.md` §7.

## 후속 (미구현)

- 4단계 벡터화: `sentence.embedding` 생성 후 벡터 정렬 (현재는 LLM 맥락 선별)
- 로그인/회원관리/관리자 모니터링(위기 학생 리스트) — 인증과 함께 이연
