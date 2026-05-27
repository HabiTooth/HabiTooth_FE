'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';

const PageWrapper = styled.div`
  max-width: 430px;
  min-height: 100svh;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.background};
  padding: 60px 20px 40px;
  display: flex;
  flex-direction: column;
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 40px;
`;

const IconBox = styled.div`
  width: 72px;
  height: 72px;
  background: ${({ theme }) => theme.colors.primaryGradient};
  border-radius: ${({ theme }) => theme.radius.xl};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AppTitle = styled.h1`
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const EyeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const RegisterLink = styled.p`
  margin: 16px 0 0;
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    text-decoration: none;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.hairline};
  }
`;

const DividerText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SocialSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const KakaoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 2C5.58 2 2 4.9 2 8.44c0 2.26 1.46 4.25 3.68 5.37l-.94 3.5 4.08-2.69c.38.05.77.08 1.18.08 4.42 0 8-2.9 8-6.44S14.42 2 10 2z"
      fill="#3A1D1D"
    />
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M14.5 10.5c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.7-.8-2.9-.7C5.3 5.7 3.8 6.7 3 8.2c-1.6 2.8-.4 7 1.1 9.3.8 1.1 1.7 2.4 2.9 2.3 1.1-.1 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.2 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.6-3.3z"
      fill="#1A1F36"
    />
    <path d="M12.2 4.5c.6-.8 1.1-1.9 1-3-1 .1-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.8-1.4z" fill="#1A1F36" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 4C5 4 1.73 8 1.73 10S5 16 10 16s8.27-4 8.27-6S15 4 10 4z" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 3l14 14M8.5 8.6A2.5 2.5 0 0012.4 12.5M6.5 5.5C4.5 6.8 2.5 8.7 2 10c1 2.7 4.4 6 8 6 1.5 0 2.9-.5 4-1.3M10 4c3.6 0 7 3.3 8 6-.3.8-.8 1.6-1.5 2.4"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ToothIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <path
      d="M18 4C13.6 4 10 7.6 10 12c0 3 1.6 5.6 4 7.1 1 .7 1.7 1.8 1.7 3.2V28c0 .6.4 1 1 1h2.6c.6 0 1-.4 1-1v-5.7c0-1.4.7-2.5 1.7-3.2 2.4-1.5 4-4.1 4-7.1 0-4.4-3.6-8-8-8z"
      fill="white"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/pairing');
    }, 1000);
  };

  return (
    <PageWrapper>
      <LogoSection>
        <IconBox>
          <ToothIcon />
        </IconBox>
        <AppTitle>HabiTooth</AppTitle>
        <Subtitle>AI 구강 케어 어시스턴트</Subtitle>
      </LogoSection>

      <FormSection>
        <Input
          label="이메일"
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={setEmail}
        />
        <Input
          label="비밀번호"
          type={showPassword ? 'text' : 'password'}
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChange={setPassword}
          rightIcon={
            <EyeButton type="button" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
            </EyeButton>
          }
        />
      </FormSection>

      <Button
        variant="primary"
        fullWidth
        isLoading={isLoading}
        disabled={!email || !password}
        onClick={handleLogin}
      >
        로그인
      </Button>

      <RegisterLink>
        아직 계정이 없으신가요?{' '}
        <Link href="/register">회원가입</Link>
      </RegisterLink>

      <Divider>
        <DividerText>또는</DividerText>
      </Divider>

      <SocialSection>
        <Button
          variant="social"
          fullWidth
          leftIcon={<KakaoIcon />}
          onClick={() => {}}
        >
          카카오로 시작하기
        </Button>
        <Button
          variant="social"
          fullWidth
          leftIcon={<AppleIcon />}
          onClick={() => {}}
        >
          Apple로 시작하기
        </Button>
      </SocialSection>
    </PageWrapper>
  );
}
