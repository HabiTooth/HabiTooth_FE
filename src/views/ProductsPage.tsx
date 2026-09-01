'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, Sparkles } from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import { dashboardApi, type DashboardRisk } from '@/lib/api/dashboard';
import { isRisky, recommendProducts } from '@/constants/products';
import { LESION_LABEL } from '@/lib/notifications/rules';
import { RISK_LABEL } from '@/lib/score';

export default function ProductsPage() {
  const router = useRouter();
  const [risk, setRisk] = useState<DashboardRisk | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    dashboardApi
      .getRisk()
      .then((res) => setRisk(res.data.result))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const risky = (risk?.categories ?? []).filter((c) => isRisky(c.riskLevel));
  const products = useMemo(() => recommendProducts(risk?.categories), [risk]);

  const matched = (helpsWith: string[]) =>
    risky.some((c) => helpsWith.includes(c.lesionType));

  return (
    <PageShell className="pb-16">
      <div className="flex items-center px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-hairline">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
        >
          <ChevronLeft size={20} className="text-content" />
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold text-content">
          관리 용품 추천
        </span>
        <div className="w-9" />
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5">
          <h2 className="m-0 text-sm font-semibold text-content mb-2">추천 기준</h2>
          {!loaded ? (
            <p className="m-0 text-[12px] text-muted">불러오는 중이에요.</p>
          ) : risky.length === 0 ? (
            <p className="m-0 text-[12px] text-muted leading-relaxed">
              지금은 특별히 신경 쓸 항목이 없어요. 지금 쓰는 것들을 그대로 유지해도 괜찮아요.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {risky.map((c) => (
                <div key={c.lesionType} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                  <span className="text-[12px] text-content">
                    {LESION_LABEL[c.lesionType]} 위험도 {RISK_LABEL[c.riskLevel]}
                  </span>
                </div>
              ))}
              <p className="m-0 mt-1 text-[11px] text-muted">
                이 결과에 도움이 되는 용품을 위로 올렸어요.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {products.map((product) => {
            const highlighted = matched(product.helpsWith);
            return (
              <div
                key={product.id}
                className={`rounded-[18px] shadow-card p-4 backdrop-blur-sm ${
                  highlighted ? 'bg-primary-light/70 border border-primary/25' : 'bg-white/90'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-semibold text-primary">
                    {product.category}
                  </span>
                  {highlighted && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-warning/20 text-[9px] font-bold text-[#B87F00]">
                      <Sparkles size={9} />내 결과와 관련
                    </span>
                  )}
                  {product.baseline && !highlighted && (
                    <span className="px-1.5 py-0.5 rounded-full bg-hairline text-[9px] font-bold text-muted">
                      기본
                    </span>
                  )}
                </div>

                <p className="m-0 text-[14px] font-semibold text-content">{product.name}</p>

                <ul className="m-0 mt-2 p-0 list-none flex flex-col gap-1">
                  {product.lookFor.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <Check size={12} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-[11.5px] text-muted leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="m-0 px-1 text-[10px] leading-relaxed text-muted">
          특정 브랜드를 권하지 않아요. 고를 때 확인할 점만 정리했어요. 이미 굳은 치석은 용품으로
          없앨 수 없고 치과에서 제거해야 해요.
        </p>
      </div>

      <NavBar activeTab="home" />
    </PageShell>
  );
}
