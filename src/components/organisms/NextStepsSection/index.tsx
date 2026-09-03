'use client';

import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import ProductThumb from '@/components/atoms/ProductThumb';
import { ARTICLES, sortByRelevance } from '@/constants/articles';
import { isRisky, recommendProducts } from '@/constants/products';
import type { LesionType, RiskLevel } from '@/lib/api/common';

export default function NextStepsSection({
  categories,
  sessionId,
}: {
  categories: Array<{ lesionType: LesionType; riskLevel: RiskLevel }>;
  sessionId?: number;
}) {
  // 어느 스캔 기준인지 넘겨야 관리 용품 페이지가 최신 스캔으로 갈아치우지 않음
  const productsHref = sessionId ? `/products?session=${sessionId}` : '/products';
  const risky = categories.filter((c) => isRisky(c.riskLevel)).map((c) => c.lesionType);
  const products = recommendProducts(categories).slice(0, 2);
  const articles = sortByRelevance(ARTICLES, risky).slice(0, 2);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5 mt-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="m-0 text-sm font-semibold text-content">이 결과로 할 수 있는 것</h2>
      </div>
      <p className="m-0 mb-4 text-[11px] text-muted">
        {risky.length > 0 ? '위험도가 높은 항목에 맞춰 골랐어요.' : '지금 상태를 유지하는 데 도움이 돼요.'}
      </p>

      <div className="flex flex-col gap-2">
        {products.map((product) => (
          <Link
            key={product.id}
            href={productsHref}
            className="flex items-center gap-3 p-2.5 rounded-[14px] border border-hairline no-underline transition-colors active:bg-hairline/40"
          >
            <ProductThumb art={product.art} tint={product.tint} size={40} />
            <span className="flex-1 min-w-0">
              <span className="block text-[10px] font-semibold text-muted">
                {product.category}
              </span>
              <span className="block text-[13px] font-semibold text-content truncate">
                {product.name}
              </span>
            </span>
            <ChevronRight size={14} className="text-muted flex-shrink-0" />
          </Link>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-dashed border-hairline flex flex-col gap-2">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            className="flex items-center gap-2 no-underline"
          >
            <span className="flex-1 min-w-0">
              <span className="block text-[12.5px] font-medium text-content truncate">
                {article.title}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <Clock size={9} />
                {article.readMinutes}분
              </span>
            </span>
            <ChevronRight size={14} className="text-muted flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
