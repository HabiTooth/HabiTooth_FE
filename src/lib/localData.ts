const PREFIX = 'habitooth.';

// 계정을 바꿔도 앞 사용자 데이터가 그대로 보이던 문제 때문에 로그아웃 때 통째로 지운다
export function clearAppData() {
  if (typeof window === 'undefined') return;
  [localStorage, sessionStorage].forEach((store) => {
    Object.keys(store)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => store.removeItem(key));
  });
}
