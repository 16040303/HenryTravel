import React from 'react';

export function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-shimmer rounded bg-neutral-200 ${className}`} />
  );
}

export function VillaCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col h-96 p-4 gap-3 animate-pulse">
      <SkeletonPulse className="w-full h-48 rounded-xl" />
      <div className="flex justify-between items-center mt-2">
        <SkeletonPulse className="h-4 w-1/3" />
        <SkeletonPulse className="h-4 w-1/6" />
      </div>
      <SkeletonPulse className="h-6 w-3/4" />
      <SkeletonPulse className="h-4 w-1/2" />
      <div className="flex gap-2 mt-2">
        <SkeletonPulse className="h-6 w-16 rounded-full" />
        <SkeletonPulse className="h-6 w-16 rounded-full" />
        <SkeletonPulse className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-neutral-50">
        <SkeletonPulse className="h-6 w-1/4" />
        <SkeletonPulse className="h-8 w-1/3 rounded-lg" />
      </div>
    </div>
  );
}

export function VillaDetailSkeleton() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-8 animate-pulse flex flex-col gap-8">
      {/* Back button skeleton */}
      <SkeletonPulse className="h-4 w-40" />

      {/* Title skeleton */}
      <div className="flex flex-col gap-2">
        <SkeletonPulse className="h-10 w-2/3 md:w-1/2" />
        <SkeletonPulse className="h-4 w-1/3" />
      </div>

      {/* Gallery skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[400px]">
        <div className="md:col-span-8 h-full">
          <SkeletonPulse className="w-full h-full rounded-2xl" />
        </div>
        <div className="md:col-span-4 flex flex-col gap-4 h-full">
          <SkeletonPulse className="w-full h-1/2 rounded-2xl" />
          <SkeletonPulse className="w-full h-1/2 rounded-2xl" />
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <SkeletonPulse className="h-24 w-full rounded-xl" />
          <SkeletonPulse className="h-48 w-full rounded-xl" />
          <SkeletonPulse className="h-32 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4">
          <SkeletonPulse className="h-[450px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function LookupSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl p-6 sm:p-8 animate-pulse flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
        <div>
          <SkeletonPulse className="h-3 w-32 mb-2" />
          <SkeletonPulse className="h-6 w-48" />
        </div>
        <SkeletonPulse className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <SkeletonPulse className="h-3 w-16" />
            <SkeletonPulse className="h-5 w-24" />
          </div>
        ))}
      </div>
      <SkeletonPulse className="h-24 w-full rounded-xl" />
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 py-8 animate-pulse flex flex-col gap-8">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-neutral-100 flex flex-col gap-2 shadow-sm">
            <SkeletonPulse className="h-3 w-20" />
            <SkeletonPulse className="h-8 w-24" />
          </div>
        ))}
      </div>

      {/* Main sections skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <SkeletonPulse className="h-8 w-48" />
          <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-neutral-50">
                <div className="flex flex-col gap-1.5 w-1/3">
                  <SkeletonPulse className="h-4 w-3/4" />
                  <SkeletonPulse className="h-3 w-1/2" />
                </div>
                <SkeletonPulse className="h-5 w-16 rounded-full" />
                <div className="flex gap-2">
                  <SkeletonPulse className="h-8 w-16 rounded" />
                  <SkeletonPulse className="h-8 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-4">
          <SkeletonPulse className="h-8 w-32" />
          <SkeletonPulse className="h-[300px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
