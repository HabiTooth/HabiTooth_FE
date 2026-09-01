'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import ProductThumb from '@/components/atoms/ProductThumb';
import { dashboardApi, type DashboardRisk } from '@/lib/api/dashboard';
import { isRisky, recommendProducts, shopUrl } from '@/constants/products';
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

  const matched = (helpsWith: string[]) => risky.some((c) => helpsWith.includes(c.lesionType));

  return (
    <PageShell withNav>
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

      <div className="px-5 pt-4 flex flex-col gap-3">
        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5">
          <h2 className="m-0 text-sm font-semibold text-content mb-2">추천 기준</h2>
          {!loaded ? (
            <p className="m-0 text-[12px] text-muted">불러오는 중이에요.</p>
          ) : risky.length === 0 ? (
            <p className="m-0 text-[12px] text-muted leading-relaxed">
              지금은 특별히 신경 쓸 항목이 없어요. 지금 쓰는 것들을 그대로 유지해도 괜찮아요.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {risky.map((c) => (
                <span
                  key={c.lesionType}
                  className="px-2.5 py-1 rounded-full bg-danger/10 text-[11px] font-semibold text-danger"
                >
                  {LESION_LABEL[c.lesionType]} {RISK_LABEL[c.riskLevel]}
                </span>
              ))}
              <p className="m-0 w-full mt-1 text-[11px] text-muted">
                이 결과에 도움이 되는 용품을 위로 올렸어요.
              </p>
            </div>
          )}
        </div>

        {products.map((product) => {
          const highlighted = matched(product.helpsWith);
          return (
            <div key={product.id} className="bg-white rounded-[20px] shadow-card overflow-hidden">
              <div className="flex gap-3 p-4">
                <ProductThumb art={product.art} tint={product.tint} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted">{product.category}</span>
                    {highlighted && (
                      <span className="px-1.5 py-0.5 rounded-full bg-danger/10 text-[9px] font-bold text-danger">
                        내 결과와 관련
                      </span>
                    )}
                  </div>

                  <p className="m-0 mt-0.5 text-[15px] font-bold text-content">{product.name}</p>

                  <ul className="m-0 mt-1.5 p-0 list-none flex flex-col gap-0.5">
                    {product.lookFor.map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <Check size={11} className="text-primary flex-shrink-0 mt-[3px]" />
                        <span className="text-[11.5px] text-muted leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {product.items.length > 0 && (
                <div className="border-t border-hairline divide-y divide-hairline">
                  {product.items.map((item) => (
                    <a
                      key={item.keyword}
                      href={shopUrl(item.keyword)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-3 no-underline transition-colors active:bg-hairline/40"
                    >
                      <span className="flex-1 min-w-0">
                        {item.brand && (
                          <span className="block text-[10px] font-bold text-muted">
                            {item.brand}
                          </span>
                        )}
                        <span className="block text-[12.5px] font-medium text-content truncate">
                          {item.name}
                        </span>
                      </span>
                      <span className="flex items-center gap-0.5 flex-shrink-0 text-[11px] font-bold text-[#7BA828]">
                        올리브영
                        <ChevronRight size={13} />
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <p className="m-0 px-1 text-[10px] leading-relaxed text-muted">
          제품을 누르면 올리브영 검색 결과로 이동해요. 가격과 재고는 올리브영에서 확인해 주세요.
          이미 굳은 치석은 용품으로 없앨 수 없고 치과에서 제거해야 해요.
        </p>
      </div>

      <NavBar activeTab="home" />
    </PageShell>
  );
}
