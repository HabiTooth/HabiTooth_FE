'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
import { Eye, EyeOff } from 'lucide-react';
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

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
        <Subtitle>가정용 AI 구강 모니터링 디바이스</Subtitle>
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
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
          leftIcon={<GoogleIcon />}
          onClick={() => {}}
        >
          Google로 시작하기
        </Button>
      </SocialSection>
    </PageWrapper>
  );
}
