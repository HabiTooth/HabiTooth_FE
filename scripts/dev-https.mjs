/**
 * HTTPS로 dev 서버를 띄운다. 폰에서 카메라를 쓰려면 보안 컨텍스트가 필요하다.
 *
 * next dev --experimental-https 는 인증서 생성이 실패해도 조용히 평문 HTTP로 폴백해
 * 원인을 찾기 어렵다. 여기서는 인증서를 직접 만들어 확인한 뒤 넘긴다.
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { X509Certificate } from 'node:crypto';

const CERT_DIR = 'certificates';
const CERT = path.join(CERT_DIR, 'localhost.pem');
const KEY = path.join(CERT_DIR, 'localhost-key.pem');

// VMware, Hyper-V 같은 가상 어댑터 주소는 폰에서 닿지 않는다
const VIRTUAL = /vmware|virtualbox|vethernet|hyper-v|loopback|bluetooth|docker|wsl/i;

function lanAddresses() {
  return Object.entries(networkInterfaces())
    .filter(([name]) => !VIRTUAL.test(name))
    .flatMap(([, addrs]) => addrs ?? [])
    .filter((a) => a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.'))
    .map((a) => a.address);
}

function findMkcert() {
  const local = path.join(process.env.LOCALAPPDATA ?? '', 'mkcert');
  if (existsSync(local)) {
    const exe = readdirSync(local).find((f) => /^mkcert.*\.exe$/i.test(f));
    if (exe) return path.join(local, exe);
  }
  try {
    execFileSync('mkcert', ['-CAROOT'], { stdio: 'ignore' });
    return 'mkcert';
  } catch {
    return null;
  }
}

/** 현재 IP를 전부 담고 있고 아직 유효하면 재발급하지 않는다 */
function certCovers(ips) {
  if (!existsSync(CERT) || !existsSync(KEY)) return false;
  try {
    const cert = new X509Certificate(readFileSync(CERT));
    if (new Date(cert.validTo) < new Date()) return false;
    const names = (cert.subjectAltName ?? '')
      .split(',')
      .map((s) => s.trim().replace(/^(DNS|IP Address):/, ''));
    return ips.every((ip) => names.includes(ip));
  } catch {
    return false;
  }
}

const ips = lanAddresses();

if (certCovers(ips)) {
  console.log('기존 인증서가 현재 IP를 모두 포함해요.');
} else {
  const mkcert = findMkcert();
  if (!mkcert) {
    console.error(
      'mkcert를 찾지 못했어요.\n' +
        'npx next dev --experimental-https 를 한 번 실행하면 자동으로 내려받아요.',
    );
    process.exit(1);
  }

  mkdirSync(CERT_DIR, { recursive: true });
  const names = ['localhost', '127.0.0.1', '::1', ...ips];
  console.log(`인증서를 새로 만들어요: ${names.join(', ')}`);
  execFileSync(mkcert, ['-cert-file', CERT, '-key-file', KEY, ...names], { stdio: 'inherit' });

  if (!certCovers(ips)) {
    console.error('인증서 생성에 실패했어요. 위 mkcert 출력을 확인해 주세요.');
    process.exit(1);
  }
}

const port = process.env.PORT ?? '3000';

console.log('\n폰에서 접속할 주소:');
for (const ip of ips) console.log(`  https://${ip}:${port}`);
console.log('  인증서 경고가 뜨면 고급 → 안전하지 않음(계속)\n');

// Node 22는 .cmd 실행을 막으므로 npx 대신 next 진입점을 직접 돌린다
const nextBin = path.join('node_modules', 'next', 'dist', 'bin', 'next');

spawn(
  process.execPath,
  [
    nextBin,
    'dev',
    '-H',
    '0.0.0.0',
    '-p',
    port,
    '--experimental-https',
    '--experimental-https-key',
    KEY,
    '--experimental-https-cert',
    CERT,
  ],
  { stdio: 'inherit' },
).on('exit', (code) => process.exit(code ?? 0));
