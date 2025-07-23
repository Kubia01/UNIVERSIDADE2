'use client'

import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4' 
}) => (
  <div 
    className={`${width} ${height} bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
  />
)

export const CourseCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <Skeleton height="h-6" className="mb-2" />
        <Skeleton height="h-4" width="w-3/4" />
      </div>
      <Skeleton width="w-16" height="h-6" className="rounded-full" />
    </div>
    
    <div className="space-y-2 mb-4">
      <Skeleton height="h-4" />
      <Skeleton height="h-4" width="w-5/6" />
    </div>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Skeleton width="w-8" height="h-8" className="rounded-full" />
        <Skeleton width="w-20" height="h-4" />
      </div>
      <Skeleton width="w-24" height="h-8" className="rounded" />
    </div>
  </div>
)

export const DashboardSkeleton: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton width="w-64" height="h-8" className="mb-2" />
        <Skeleton width="w-96" height="h-4" />
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Skeleton width="w-8" height="h-8" className="rounded" />
            <Skeleton width="w-16" height="h-6" />
          </div>
          <Skeleton width="w-24" height="h-8" className="mb-2" />
          <Skeleton width="w-32" height="h-4" />
        </div>
      ))}
    </div>

    {/* Course Grid */}
    <div>
      <Skeleton width="w-48" height="h-6" className="mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)

export const UserListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton width="w-10" height="h-10" className="rounded-full" />
            <div>
              <Skeleton width="w-32" height="h-5" className="mb-1" />
              <Skeleton width="w-48" height="h-4" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton width="w-16" height="h-6" className="rounded-full" />
            <Skeleton width="w-8" height="h-8" className="rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

interface FastLoadingProps {
  message?: string
}

export const FastLoading: React.FC<FastLoadingProps> = ({ 
  message = "Carregando..." 
}) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
    </div>
  </div>
)