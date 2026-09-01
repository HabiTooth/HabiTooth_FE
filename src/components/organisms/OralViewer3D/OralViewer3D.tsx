'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useDentitionStore } from '@/stores/dentitionStore';
import type { ToothAnalysisResult } from './ThreeScene';

const ThreeScene = dynamic(() => import('./ThreeScene'), { ssr: false });

interface OralViewer3DProps {
  analysisResults: ToothAnalysisResult[];
  onToothSelect?: (result: ToothAnalysisResult) => void;
  calibrationMode?: boolean;
}

export default function OralViewer3D({
  analysisResults,
  onToothSelect,
  calibrationMode = false,
}: OralViewer3DProps) {
  const { missing, hydrate } = useDentitionStore();

  useEffect(() => hydrate(), [hydrate]);

  return (
    <div className="w-full h-full">
      <ThreeScene
        analysisResults={analysisResults}
        missingTeeth={missing}
        onToothSelect={onToothSelect}
        calibrationMode={calibrationMode}
      />
    </div>
  );
}
