'use client'

import { useState, useEffect } from 'react'
import styles from './SearchAndFilter.module.css'

interface SearchAndFilterProps {
  onFiltersChange: (filters: FilterState) => void
  totalResults: number
  collection: any[]
}

export interface FilterState {
  search: string
  artist: string
  title: string
  genre: string
  year: string
  yearFrom: string
  yearTo: string
  sortBy: 'newest' | 'oldest' | 'artist' | 'title' | 'year'
  displayLimit: number
}

export default function SearchAndFilter({ onFiltersChange, totalResults, collection }: SearchAndFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    artist: '',
    title: '',
    genre: '',
    year: '',
    yearFrom: '',
    yearTo: '',
    sortBy: 'newest',
    displayLimit: 12
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    // Load saved filters from localStorage
    const savedFilters = localStorage.getItem('vinylFilters')
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters)
      setFilters(parsedFilters)
    }
    setHasLoaded(true)
  }, [])

  useEffect(() => {
    if (hasLoaded) {
      // Save filters to localStorage
      localStorage.setItem('vinylFilters', JSON.stringify(filters))
      // Use a timeout to prevent immediate re-renders
      const timeoutId = setTimeout(() => {
        onFiltersChange(filters)
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [filters, hasLoaded]) // Remove onFiltersChange from dependencies

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      artist: '',
      title: '',
      genre: '',
      year: '',
      yearFrom: '',
      yearTo: '',
      sortBy: 'newest',
      displayLimit: 12
    })
  }

  const getUniqueGenres = () => {
    const allGenres = collection.flatMap(vinyl => vinyl.genre || [])
    return Array.from(new Set(allGenres)).sort()
  }

  const hasActiveFilters = filters.search || filters.artist || filters.title || 
                          filters.genre || filters.year || filters.yearFrom || filters.yearTo

  return (
    <div className={styles.searchAndFilter}>
      {/* Main Search Bar */}
      <div className={styles.mainSearch}>
        <input
          type="text"
          placeholder="Search your collection..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className={styles.searchInput}
        />
        <button 
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={styles.advancedToggle}
        >
          {showAdvanced ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <input
              type="text"
              placeholder="Filter by Artist"
              value={filters.artist}
              onChange={(e) => handleFilterChange('artist', e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by Title"
              value={filters.title}
              onChange={(e) => handleFilterChange('title', e.target.value)}
            />
            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
            >
              <option value="">All Genres</option>
              {getUniqueGenres().map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterRow}>
            <input
              type="number"
              placeholder="Exact Year"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            />
            <input
              type="number"
              placeholder="From Year"
              value={filters.yearFrom}
              onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
            />
            <input
              type="number"
              placeholder="To Year"
              value={filters.yearTo}
              onChange={(e) => handleFilterChange('yearTo', e.target.value)}
            />
          </div>

          <div className={styles.filterRow}>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value as FilterState['sortBy'])}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="artist">Artist A-Z</option>
              <option value="title">Title A-Z</option>
              <option value="year">Year</option>
            </select>

            <select
              value={filters.displayLimit}
              onChange={(e) => handleFilterChange('displayLimit', parseInt(e.target.value))}
            >
              <option value={12}>Show 12</option>
              <option value={24}>Show 24</option>
              <option value={48}>Show 48</option>
              <option value={96}>Show 96</option>
              <option value={collection.length}>Show All</option>
            </select>

            {hasActiveFilters && (
              <button 
                type="button"
                onClick={clearFilters}
                className={styles.clearButton}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className={styles.resultsSummary}>
        {hasActiveFilters ? (
          <span>Showing {totalResults} of {collection.length} records</span>
        ) : (
          <span>{totalResults} records total</span>
        )}
      </div>
    </div>
  )
}