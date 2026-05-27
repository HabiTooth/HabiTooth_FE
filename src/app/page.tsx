'use client';

import styled from 'styled-components';

const Main = styled.main`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
`;

export default function Home() {
  return (
    <Main>
      <Title>HabiTooth</Title>
    </Main>
  );
}
