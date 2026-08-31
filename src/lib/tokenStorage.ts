const TOKEN_KEY = 'accessToken';
const EMAIL_KEY = 'userEmail';

// 로그인 유지 체크 시 localStorage(브라우저 종료 후에도 유지),
// 체크 안 하면 sessionStorage(탭 닫으면 사라짐)에 저장한다.
export function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function readEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(EMAIL_KEY) ?? sessionStorage.getItem(EMAIL_KEY);
}

export function writeAuth(token: string, email: string | null, remember: boolean) {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(TOKEN_KEY);
  other.removeItem(EMAIL_KEY);
  target.setItem(TOKEN_KEY, token);
  if (email) target.setItem(EMAIL_KEY, email);
}

export function clearStoredAuth() {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(EMAIL_KEY);
  });
}

// JWT exp 클레임으로 만료 여부 판정 (서버 요청 없이 선차단)
export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true; // 파싱 불가한 토큰은 만료로 간주
  }
}
