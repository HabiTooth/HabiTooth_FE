import dynamic from 'next/dynamic';
import type { ToothAnalysisResult } from './ThreeScene';

const ThreeScene = dynamic(() => import('./ThreeScene'), { ssr: false });

interface OralViewer3DProps {
  analysisResults: ToothAnalysisResult[];
  onToothSelect?: (result: ToothAnalysisResult) => void;
  calibrationMode?: boolean;
}

export default function OralViewer3D({ analysisResults, onToothSelect, calibrationMode = false }: OralViewer3DProps) {
  return (
    <div className="w-full h-full">
      <ThreeScene analysisResults={analysisResults} onToothSelect={onToothSelect} calibrationMode={calibrationMode} />
    </div>
  );
}