# 알림 기능 백엔드 요구사항

프론트는 먼저 붙여놨음. 지금은 브라우저 localStorage에만 쌓이고 있어서
기기를 바꾸면 알림이 사라지고, 앱을 안 열면 아무것도 안 옴.
아래대로 API가 나오면 프론트는 저장소만 갈아끼우면 됨.

## 지금 프론트 상태

| 항목 | 상태 |
|---|---|
| 알림함 화면 | `/notifications` — 목록, 읽음/전체 읽음, 개별/전체 삭제 |
| 헤더 벨 배지 | 안 읽음 개수 표시 |
| 브라우저 알림 | Notification API로 앱 열려 있을 때 표시 (권한 요청 UI 포함) |
| 알림 생성 | 프론트에서 대시보드/스캔 데이터 보고 직접 만듦 |
| 설정 연동 | `/api/user/notification` 토글을 로컬에 복제해서 필터로 씀 |

관련 코드: `src/lib/notifications/`, `src/stores/notificationStore.ts`, `src/views/NotificationsPage.tsx`

## 1. 알림 CRUD

### `GET /api/notifications`

쿼리: `cursor`(선택), `size`(기본 20)

```json
{
  "success": true,
  "code": "COMMON200",
  "message": "성공",
  "result": {
    "items": [
      {
        "notificationId": 12,
        "type": "REPORT_READY",
        "title": "분석 리포트가 준비됐어요",
        "body": "이번 스캔 점수는 84점이에요.",
        "link": "/report/57",
        "read": false,
        "createdAt": "2026-09-01T09:12:33"
      }
    ],
    "unreadCount": 3,
    "nextCursor": null
  }
}
```

### `PATCH /api/notifications/{id}/read` — 하나 읽음
### `PATCH /api/notifications/read-all` — 전부 읽음
### `DELETE /api/notifications/{id}` — 하나 삭제
### `DELETE /api/notifications` — 전부 삭제

### `GET /api/notifications/unread-count`

배지만 필요할 때 쓰는 가벼운 엔드포인트. 헤더가 화면마다 뜨니까 목록 전체를 매번 받는 건 낭비.

```json
{ "result": { "unreadCount": 3 } }
```

## 2. type enum

프론트가 아이콘·색·이동 경로를 이 값으로 가름. 값이 늘면 프론트도 같이 고쳐야 하니 미리 알려주기.

| type | 언제 | link |
|---|---|---|
| `REPORT_READY` | 세션 분석 완료 | `/report/{sessionId}` |
| `SCAN_REMINDER` | 마지막 스캔 후 3일 경과 | `/scan` |
| `RISK_ALERT` | 위험도 HIGH/CRITICAL 발생 | `/report/{sessionId}` |
| `STREAK` | 연속 스캔 3·7·14·30·100일 달성 | `/streak` |
| `CHECKUP` | 마지막 치과 방문 후 6개월 경과 | `/clinics` |

## 3. 서버에서 만들어야 하는 것

지금은 프론트가 대시보드를 열어야만 알림이 생김. 앱을 안 열면 리마인더가 영영 안 옴.
아래 두 개는 서버 스케줄러가 있어야 함.

- **`SCAN_REMINDER`** — 매일 1회, 마지막 스캔이 3일 넘은 사용자에게 생성
- **`CHECKUP`** — 매일 1회, 마지막 치과 방문일이 182일 넘은 사용자에게 생성

`REPORT_READY`와 `RISK_ALERT`는 분석 완료 시점에 서버가 만드는 게 정확함
(프론트는 분석 요청을 보낸 브라우저에서만 알 수 있어서, 다른 기기에서는 못 받음).

**중복 방지**: 같은 사용자·같은 type에 대해
`REPORT_READY`/`RISK_ALERT`는 sessionId 단위로, `SCAN_REMINDER`는 날짜 단위로,
`STREAK`는 달성 일수 단위로 한 번만. 유니크 제약이나 `dedupe_key` 컬럼 하나면 됨.

## 4. 설정 반영

`user.pushNotificationEnabled`가 false면 알림 자체를 만들지 말기.
`reportNotificationEnabled`가 false면 `REPORT_READY`만 빼기.
(프론트도 같은 규칙으로 거르지만, 서버에서 안 걸러주면 다른 기기에서 새는 건 못 막음)

## 5. 나중에 (지금은 안 해도 됨)

웹 푸시(FCM)까지 갈 거면 그때 추가로 필요한 것:

- `POST /api/notifications/token` — 기기 FCM 토큰 등록
- `DELETE /api/notifications/token` — 로그아웃 시 해제
- 알림 생성 시점에 FCM 발송

지금 범위는 인앱 알림함 + 브라우저 로컬 알림까지라 위 5개 API로 충분함.

## 6. 필요한 다른 데이터

`CHECKUP` 알림을 만들려면 마지막 치과 방문일이 필요한데 지금 저장하는 데가 없음.
사용자 프로필에 `lastDentalVisitAt` (nullable date) 하나 추가 요청.
