'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Checkbox from '@/components/atoms/Checkbox';

const PageWrapper = styled.div`
  max-width: 430px;
  min-height: 100svh;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.background};
  padding: 56px 20px 40px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  position: relative;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PageTitle = styled.h2`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
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

const TermsCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadow.card};
  margin-bottom: 24px;
`;

const CardTitle = styled.h3`
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.hairline};
  margin: 12px 0;
`;

const TermRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
`;

const RequiredTag = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const LoginLink = styled.p`
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

  const passwordError =
    confirmPassword && password !== confirmPassword ? '비밀번호가 일치하지 않습니다' : undefined;

  const canSubmit =
    name && email && password.length >= 8 && !passwordError && requiredChecked;

  const handleRegister = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/pairing');
    }, 1000);
  };

  return (
    <PageWrapper>
      <Header>
        <BackButton type="button" onClick={() => router.back()}>
          <ChevronLeft size={24} />
        </BackButton>
        <PageTitle>회원가입</PageTitle>
      </Header>

      <FormSection>
        <Input label="이름" type="text" placeholder="이름을 입력해주세요" value={name} onChange={setName} />
        <Input label="이메일" type="email" placeholder="example@email.com" value={email} onChange={setEmail} />
        <Input
          label="비밀번호"
          type={showPw ? 'text' : 'password'}
          placeholder="8자 이상 입력해주세요"
          value={password}
          onChange={setPassword}
          rightIcon={
            <EyeButton type="button" onClick={() => setShowPw((v) => !v)}>
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </EyeButton>
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
            <EyeButton type="button" onClick={() => setShowConfirm((v) => !v)}>
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </EyeButton>
          }
        />
      </FormSection>

      <TermsCard>
        <CardTitle>약관 동의</CardTitle>
        <Checkbox label="전체 동의" checked={allChecked} onChange={toggleAll} bold />
        <Divider />
        <TermRow>
          <Checkbox label="이용약관 동의" checked={terms} onChange={setTerms} />
          <RequiredTag>필수</RequiredTag>
        </TermRow>
        <TermRow>
          <Checkbox label="개인정보 처리방침 동의" checked={privacy} onChange={setPrivacy} />
          <RequiredTag>필수</RequiredTag>
        </TermRow>
        <TermRow>
          <Checkbox label="마케팅 수신 동의" checked={marketing} onChange={setMarketing} />
          <RequiredTag>선택</RequiredTag>
        </TermRow>
      </TermsCard>

      <Button
        variant="primary"
        fullWidth
        isLoading={isLoading}
        disabled={!canSubmit}
        onClick={handleRegister}
      >
        가입하기
      </Button>

      <LoginLink>
        이미 계정이 있으신가요?{' '}
        <Link href="/login">로그인</Link>
      </LoginLink>
    </PageWrapper>
  );
}
