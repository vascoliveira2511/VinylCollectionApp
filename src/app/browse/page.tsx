"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import VinylCard from "../components/VinylCard";
import AddToCollectionButton from "../components/AddToCollectionButton";
import styles from "../page.module.css";

interface BrowseItem {
  id: string;
  title: string;
  artist: string;
  year?: number;
  format: string[];
  genre: string[];
  style: string[];
  label: string[];
  country: string;
  thumb: string;
  uri: string;
  type: "release" | "master";
  catno?: string;
  // Additional fields
  barcode?: string[];
  master_id?: number;
  master_url?: string;
  resource_url?: string;
  community?: {
    have: number;
    want: number;
  };
}

interface BrowseFilters {
  query?: string;
  artist?: string;
  title?: string;
  label?: string;
  genre?: string;
  style?: string;
  country?: string;
  year?: string;
  format?: string;
  type?: "release" | "master" | "artist" | "label";
  sort?: "title" | "artist" | "year" | "country" | "format";
  sort_order?: "asc" | "desc";
  per_page?: number;
  page?: number;
}

interface Suggestion {
  id: string;
  artist: string;
  title: string;
  genre: string[];
  style: string[];
  year: number | null;
  format: string[];
  label: string[];
  thumb: string | null;
  country: string | null;
  catno: string | null;
}

interface Collection {
  id: number;
  title: string;
  description?: string;
  isDefault: boolean;
  _count: {
    vinyls: number;
  };
}

function BrowsePageContent() {
  const [results, setResults] = useState<BrowseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Search filters
  const [filters, setFilters] = useState<BrowseFilters>({
    query: "",
    type: "release",
    sort: "title",
    sort_order: "asc",
    per_page: 50,
    page: 1,
  });

  // Pagination
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  // Filter states for results
  const [genreFilter, setGenreFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, setSortBy] = useState<
    "relevance" | "artist" | "title" | "year"
  >("relevance");

  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collectionsData =
          (await apiClient.getCollections()) as Collection[];
        setCollections(collectionsData);
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };
    fetchCollections();
  }, []);

  // Load filters from URL on mount
  useEffect(() => {
    const urlFilters: BrowseFilters = {
      query: searchParams.get("q") || "",
      artist: searchParams.get("artist") || "",
      title: searchParams.get("title") || "",
      label: searchParams.get("label") || "",
      genre: searchParams.get("genre") || "",
      style: searchParams.get("style") || "",
      country: searchParams.get("country") || "",
      year: searchParams.get("year") || "",
      format: searchParams.get("format") || "",
      type: (searchParams.get("type") as any) || "release",
      sort: (searchParams.get("sort") as any) || "title",
      sort_order: (searchParams.get("sort_order") as any) || "asc",
      per_page: parseInt(searchParams.get("per_page") || "50"),
      page: parseInt(searchParams.get("page") || "1"),
    };

    setFilters(urlFilters);

    // Auto-search if there's a query in the URL
    if (urlFilters.query) {
      handleSearch(urlFilters);
    }
  }, [searchParams]);

  const updateURL = (newFilters: BrowseFilters) => {
    const params = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value.toString());
      }
    });

    router.push(`/browse?${params.toString()}`);
  };

  const handleSearch = async (urlFilters: BrowseFilters) => {
    if (!filters.query) {
      setError("Please enter a search term");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const searchFilters = {
        query: filters.query,
        type: "release" as const,
        per_page: 50,
        page: 1,
      };
      const apiResponse = (await apiClient.searchDiscogsAdvanced(
        searchFilters
      )) as {
        results?: BrowseItem[];
        pagination?: { pages?: number; items?: number };
      };
      const data: {
        results: BrowseItem[];
        pagination?: { pages?: number; items?: number };
      } = {
        results: apiResponse.results ?? [],
        pagination: apiResponse.pagination ?? { pages: 0, items: 0 },
      };
      setResults(data.results);
      setTotalPages(data.pagination?.pages || 0);
      setTotalResults(data.pagination?.items || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    key: keyof BrowseFilters,
    value: string | number
  ) => {
    const newFilters = { ...filters, [key]: value };
    if (key !== "page") {
      newFilters.page = 1; // Reset to first page when changing filters
    }
    setFilters(newFilters);
  };

  const handleSearchInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = e.target.value;
    handleFilterChange("query", query);

    if (query.length > 2) {
      setIsSearching(true);
      try {
        const data = await apiClient.searchDiscogs(query);
        setSuggestions(Array.isArray(data) ? (data as Suggestion[]) : []);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSuggestions([]);
    if (suggestion.id) {
      router.push(`/browse/${suggestion.id}`);
    } else {
      setError("Unable to view details - no ID available");
    }
  };

  const handlePageChange = async (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);

    setLoading(true);
    setError(null);

    try {
      const searchFilters = {
        query: newFilters.query,
        type: "release" as const,
        per_page: 50,
        page: newPage,
      };
      const data = (await apiClient.searchDiscogsAdvanced(searchFilters)) as {
        results?: BrowseItem[];
        pagination?: { pages?: number; items?: number };
      };
      setResults(data.results || []);
      setTotalPages(data.pagination?.pages || 0);
      setTotalResults(data.pagination?.items || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort results
  const filteredAndSortedResults = results
    .filter((item) => {
      const matchesGenre =
        !genreFilter ||
        item.genre.some((g) =>
          g.toLowerCase().includes(genreFilter.toLowerCase())
        ) ||
        item.style.some((s) =>
          s.toLowerCase().includes(genreFilter.toLowerCase())
        );

      const matchesFormat =
        !formatFilter ||
        item.format.some((f) =>
          f.toLowerCase().includes(formatFilter.toLowerCase())
        );

      const matchesCountry =
        !countryFilter ||
        (item.country &&
          item.country.toLowerCase().includes(countryFilter.toLowerCase()));

      const matchesYear =
        !yearFilter || (item.year && item.year.toString().includes(yearFilter));

      return matchesGenre && matchesFormat && matchesCountry && matchesYear;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "artist":
          return a.artist.localeCompare(b.artist);
        case "title":
          return a.title.localeCompare(b.title);
        case "year":
          return (b.year || 0) - (a.year || 0);
        default:
          return 0; // Keep original order for relevance
      }
    });

  const addToCollection = async (item: BrowseItem, collectionId?: number) => {
    try {
      const vinylData = {
        artist: item.artist,
        title: item.title,
        year: item.year || null,
        imageUrl: item.thumb || null,
        genre: item.genre || [],
        discogsId: parseInt(item.id),
        label: item.label?.[0] || null,
        format: item.format?.[0] || null,
        country: item.country || null,
        catalogNumber: item.catno || null,
        ...(collectionId && { collectionId }),
      };

      await apiClient.addVinyl(vinylData);

      const collectionName = collectionId
        ? collections.find((c) => c.id === collectionId)?.title || "collection"
        : "your collection";

      alert(`"${item.title}" by ${item.artist} added to ${collectionName}!`);
    } catch (err) {
      alert(
        "Failed to add to collection: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  return (
    <main className={styles.main}>
      <div className="container">
        {/* Header */}
        <div className="window">
          <div className="title-bar">Browse & Discover Music</div>
          <div className={styles.contentSection}>
            <div className={styles.browseIntro}>
              <h2>Explore Music Database</h2>
              <p>
                Discover millions of releases from around the world. Search by
                artist, album, label, genre and more to find new music for your
                collection.
                <br />
                <small style={{ color: "var(--ctp-subtext1)" }}>
                  Try searches like: "Pink Floyd", "Kind of Blue", "Blue Note
                  Records", or "Jazz Vinyl"
                </small>
              </p>
              <div className={styles.browseActions}>
                <Link href="/" className={styles.manageButton}>
                  My Collection
                </Link>
                <Link href="/collections" className={styles.statsButton}>
                  Collections
                </Link>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Search Form */}
            <div className={styles.filterSection}>
              <h3>Search Music Database</h3>
              <div className={styles.searchContainer}>
                <div className={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="Search for artist, album, label..."
                    value={filters.query || ""}
                    onChange={handleSearchInputChange}
                    className={styles.searchInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setSuggestions([]);
                        handleSearch(filters);
                      }
                    }}
                  />
                  {isSearching && (
                    <div className={styles.searchingIndicator}>
                      Searching...
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <ul className={styles.suggestionsList}>
                      {suggestions.map((s, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(s)}
                          className={styles.suggestionItem}
                        >
                          <div className={styles.suggestionContent}>
                            {s.thumb && (
                              <img
                                src={`/api/image-proxy?url=${encodeURIComponent(
                                  s.thumb.replace("_150", "_300")
                                )}`}
                                alt={`${s.title} cover`}
                                className={styles.suggestionThumb}
                                style={{ borderRadius: "4px" }}
                              />
                            )}
                            <div className={styles.suggestionInfo}>
                              <div className={styles.suggestionMain}>
                                <strong>{s.artist}</strong> - {s.title}
                              </div>
                              <div className={styles.suggestionMeta}>
                                {s.year && <span>{s.year}</span>}
                                {s.country && <span> • {s.country}</span>}
                                {s.format.length > 0 && (
                                  <span> • {s.format[0]}</span>
                                )}
                                {s.label.length > 0 && (
                                  <span> • {s.label[0]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSuggestions([]);
                    handleSearch(filters);
                  }}
                  disabled={loading}
                  className={styles.createButton}
                  style={{ marginTop: "12px" }}
                >
                  {loading ? (
                    <>
                      <div className="vinyl-loader" style={{width: '16px', height: '16px', marginRight: '8px'}}>
                        <div className="vinyl-record"></div>
                      </div>
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        {hasSearched && results.length > 0 && (
          <div className="window">
            <div
              className="title-bar"
              style={{ cursor: "pointer" }}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filter & Sort Results {showFilters ? "▲" : "▼"}
            </div>
            {showFilters && (
              <div className={styles.contentSection}>
                <div className={styles.filterGrid}>
                  <div className={styles.filterGroup}>
                    <label>Genre/Style:</label>
                    <input
                      type="text"
                      placeholder="e.g. Jazz, Rock, Electronic..."
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Format:</label>
                    <input
                      type="text"
                      placeholder="e.g. Vinyl, CD, Cassette..."
                      value={formatFilter}
                      onChange={(e) => setFormatFilter(e.target.value)}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Country:</label>
                    <input
                      type="text"
                      placeholder="e.g. US, UK, Germany..."
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Year:</label>
                    <input
                      type="text"
                      placeholder="e.g. 1970, 198..."
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                    />
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="artist">Artist A-Z</option>
                      <option value="title">Title A-Z</option>
                      <option value="year">Year (Newest)</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <button
                      onClick={() => {
                        setGenreFilter("");
                        setFormatFilter("");
                        setCountryFilter("");
                        setYearFilter("");
                        setSortBy("relevance");
                      }}
                      className={styles.clearButton}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div className="window">
            <div className="title-bar">
              {loading
                ? "Searching..."
                : `Search Results (${filteredAndSortedResults.length} of ${totalResults} shown)`}
            </div>
            <div className={styles.contentSection}>
              {loading && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <p>Searching music database...</p>
                </div>
              )}

              {error && <div className={styles.errorMessage}>{error}</div>}

              {!loading &&
                filteredAndSortedResults.length === 0 &&
                hasSearched &&
                !error && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--ctp-subtext1)",
                    }}
                  >
                    <p>
                      No results found. Try adjusting your search terms or
                      filters.
                    </p>
                  </div>
                )}

              {!loading && filteredAndSortedResults.length > 0 && (
                <>
                  <div className={styles.collectionGrid}>
                    {filteredAndSortedResults.map((item) => (
                      <VinylCard
                        key={`${item.type}-${item.id}`}
                        vinyl={{
                          ...item,
                          genre: [...(item.genre || []), ...(item.style || [])],
                        }}
                        showDetails={true}
                        linkPrefix="/browse"
                        addToCollectionComponent={
                          <AddToCollectionButton
                            collections={collections}
                            onAdd={(collectionId) =>
                              addToCollection(item, collectionId)
                            }
                          />
                        }
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div
                      className={styles.displayControls}
                      style={{ marginTop: "20px", justifyContent: "center" }}
                    >
                      <button
                        onClick={() => handlePageChange(filters.page! - 1)}
                        disabled={filters.page === 1}
                        className={styles.viewButton}
                      >
                        ← Previous
                      </button>

                      <span
                        style={{
                          padding: "8px 16px",
                          color: "var(--ctp-text)",
                        }}
                      >
                        Page {filters.page} of {totalPages}
                      </span>

                      <button
                        onClick={() => handlePageChange(filters.page! + 1)}
                        disabled={filters.page === totalPages}
                        className={styles.viewButton}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrowsePageContent />
    </Suspense>
  );
}
