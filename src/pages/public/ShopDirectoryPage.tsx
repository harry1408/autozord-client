import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Wrench, ArrowRight } from 'lucide-react';
import api from '@/services/api';
import { PublicShop } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

export default function ShopDirectoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-shops'],
    queryFn: () => api.get<{ success: boolean; data: PublicShop[] }>('/public/shops'),
  });

  const shops = data?.data.data ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Find a Repair Shop</h1>
        <p className="text-zinc-400 text-sm">
          Browse shops on Autozord and request a quote from one or more at once.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : shops.length === 0 ? (
        <EmptyState icon={Wrench} title="No shops available yet" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shops.map(shop => (
            <div key={shop.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-2">{shop.name}</h3>
              {(shop.city || shop.state) && (
                <p className="flex items-center gap-1.5 text-sm text-zinc-400 mb-1">
                  <MapPin size={14} /> {[shop.city, shop.state].filter(Boolean).join(', ')}
                </p>
              )}
              {shop.phone && (
                <p className="flex items-center gap-1.5 text-sm text-zinc-400 mb-4">
                  <Phone size={14} /> {shop.phone}
                </p>
              )}
              <Link
                to={`/inquiry?shopId=${shop.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300"
              >
                Request a quote <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
