'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Checkbox from '@/components/atoms/Checkbox';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const allChecked = terms && privacy && marketing;
  const requiredChecked = terms && privacy;

  const toggleAll = (v: boolean) => {
    setTerms(v);
    setPrivacy(v);
    setMarketing(v);
  };

  const emailError =
    email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '올바른 이메일 형식이 아니에요' : undefined;

  const passwordLengthError =
    password && password.length < 8 ? '비밀번호는 8자 이상이어야 해요' : undefined;

  const passwordError =
    confirmPassword && password !== confirmPassword ? '비밀번호가 일치하지 않아요' : undefined;

  const canSubmit = !!(
    name &&
    email && !emailError &&
    password.length >= 8 &&
    !passwordError &&
    requiredChecked
  );

  const handleRegister = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/pairing');
    }, 1000);
  };

  return (
    <div className="max-w-[430px] min-h-svh mx-auto bg-background px-5 pt-[56px] pb-10 flex flex-col relative z-10">
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />

      <div className="flex items-center mb-8 relative z-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center p-1 bg-transparent border-none cursor-pointer text-content"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="absolute left-1/2 -translate-x-1/2 m-0 text-[18px] font-bold text-content">
          회원가입
        </h2>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-6 mb-4 relative z-10">
        <div className="flex flex-col gap-4">
          <Input label="이름" type="text" placeholder="이름을 입력해주세요" value={name} onChange={setName} />
          <Input label="이메일" type="email" placeholder="example@email.com" value={email} onChange={setEmail} error={emailError} />
          <Input
            label="비밀번호"
            type={showPw ? 'text' : 'password'}
            placeholder="8자 이상 입력해주세요"
            value={password}
            onChange={setPassword}
            error={passwordLengthError}
            rightIcon={
              <button type="button" onClick={() => setShowPw((v) => !v)} className="flex items-center text-muted bg-transparent border-none cursor-pointer p-0">
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />
          <Input
            label="비밀번호 확인"
            type={showConfirm ? 'text' : 'password'}
            placeholder="비밀번호를 다시 입력해주세요"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={passwordError}
            rightIcon={
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="flex items-center text-muted bg-transparent border-none cursor-pointer p-0">
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mb-5 relative z-10">
        <h3 className="m-0 mb-4 text-[15px] font-semibold text-content">약관 동의</h3>
        <Checkbox label="전체 동의" checked={allChecked} onChange={toggleAll} bold />
        <hr className="border-none border-t border-hairline my-3" />
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between py-1">
            <Checkbox label="이용약관 동의" checked={terms} onChange={setTerms} />
            <div className="flex items-center gap-1">
              <span className="text-[12px] text-muted">필수</span>
              <Link href="/terms" className="flex items-center text-muted">
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <Checkbox label="개인정보 처리방침 동의" checked={privacy} onChange={setPrivacy} />
            <div className="flex items-center gap-1">
              <span className="text-[12px] text-muted">필수</span>
              <Link href="/privacy" className="flex items-center text-muted">
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <Checkbox label="마케팅 수신 동의" checked={marketing} onChange={setMarketing} />
            <div className="flex items-center gap-1">
              <span className="text-[12px] text-muted">선택</span>
              <Link href="/marketing" className="flex items-center text-muted">
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <Button variant="primary" fullWidth isLoading={isLoading} disabled={!canSubmit} onClick={handleRegister}>
          가입하기
        </Button>
      </div>

      <p className="mt-4 mb-0 text-center text-sm text-muted relative z-10">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary font-semibold no-underline">로그인</Link>
      </p>
    </div>
  );
}
