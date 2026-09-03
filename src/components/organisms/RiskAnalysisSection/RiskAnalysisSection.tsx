'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ScanCoverageSection from '@/components/organisms/ScanCoverageSection';
import { ZONE_GROUP_ORDER, zonesOfGroup } from '@/constants/scanZones';
import OralViewer3D from '@/components/organisms/OralViewer3D';
import { LESION_FILL } from '@/lib/riskColors';
import type { RiskAnalysisSectionProps } from './RiskAnalysisSection.types';

const BARS = [
  { label: '치태', color: LESION_FILL.PLAQUE },
  { label: '치석', color: LESION_FILL.CALCULUS },
] as const;

export default function RiskAnalysisSection({
  plaque,
  calculus,
  analysisResults = [],
  scannedTeeth,
  capturedZones = [],
  calibrationMode = false,
}: RiskAnalysisSectionProps) {
  const values = [plaque, calculus];
  const [showZones, setShowZones] = useState(false);
  const totalZones = ZONE_GROUP_ORDER.reduce((sum, g) => sum + zonesOfGroup(g).length, 0);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mt-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">위험 부위 분석</h2>

      <div className="bg-gradient-to-b from-[#F4F8FF] to-[#E9F0FA] rounded-xl overflow-hidden h-[300px] mb-4">
        <OralViewer3D
          analysisResults={analysisResults}
          scannedTeeth={scannedTeeth}
          calibrationMode={calibrationMode}
        />
      </div>

      <div className="space-y-3">
        {BARS.map(({ label, color }, i) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-700">{label}</span>
              </div>
              <span className="text-xs font-semibold text-gray-800 tabular-nums">
                {values[i]}%
              </span>
            </div>
            <div className="w-full bg-hairline/70 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-[width] duration-500"
                style={{ width: `${Math.min(values[i], 100)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>

      {capturedZones.length > 0 && (
        <div className="mt-4 pt-3 border-t border-hairline">
          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            aria-expanded={showZones}
            className="w-full flex items-center gap-2 text-left"
          >
            <span className="text-[13px] font-semibold text-content">촬영한 구역</span>
            <span className="text-[12px] font-bold text-primary tabular-nums">
              {capturedZones.length}/{totalZones}
            </span>
            <ChevronDown
              size={16}
              className={`ml-auto text-muted transition-transform ${showZones ? 'rotate-180' : ''}`}
            />
          </button>

          {showZones && (
            <div className="mt-3">
              <ScanCoverageSection captured={capturedZones} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
