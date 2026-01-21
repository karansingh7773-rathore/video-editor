import { useState, useCallback } from "react";
import { IAudio } from "@designcombo/types";

interface FreesoundAudio extends Partial<IAudio> {
    metadata?: {
        author?: string;
        duration?: number;
        tags?: string[];
        freesoundId?: number;
    };
}

interface FreesoundResponse {
    results: FreesoundAudio[];
    count: number;
    next: string | null;
    previous: string | null;
}

interface UseFreesoundReturn {
    audios: FreesoundAudio[];
    loading: boolean;
    error: string | null;
    totalResults: number;
    currentPage: number;
    hasNextPage: boolean;
    searchAudios: (query: string, page?: number) => Promise<void>;
    loadPopularAudios: (page?: number) => Promise<void>;
    searchAudiosAppend: (query: string, page?: number) => Promise<void>;
    loadPopularAudiosAppend: (page?: number) => Promise<void>;
    clearAudios: () => void;
}

export function useFreesound(): UseFreesoundReturn {
    const [audios, setAudios] = useState<FreesoundAudio[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);

    const fetchAudios = useCallback(async (url: string, append = false) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }

            const data: FreesoundResponse = await response.json();

            if (append) {
                setAudios(prev => [...prev, ...data.results]);
            } else {
                setAudios(data.results);
            }
            setTotalResults(data.count);
            setHasNextPage(!!data.next);
        } catch (err: any) {
            setError(err.message || "Failed to fetch audios");
            if (!append) setAudios([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const searchAudios = useCallback(async (query: string, page = 1) => {
        setCurrentPage(page);
        await fetchAudios(`/api/freesound?query=${encodeURIComponent(query)}&page=${page}`);
    }, [fetchAudios]);

    const searchAudiosAppend = useCallback(async (query: string, page = 1) => {
        setCurrentPage(page);
        await fetchAudios(`/api/freesound?query=${encodeURIComponent(query)}&page=${page}`, true);
    }, [fetchAudios]);

    const loadPopularAudios = useCallback(async (page = 1) => {
        setCurrentPage(page);
        // Empty query returns popular/trending sounds
        await fetchAudios(`/api/freesound?page=${page}`);
    }, [fetchAudios]);

    const loadPopularAudiosAppend = useCallback(async (page = 1) => {
        setCurrentPage(page);
        await fetchAudios(`/api/freesound?page=${page}`, true);
    }, [fetchAudios]);

    const clearAudios = useCallback(() => {
        setAudios([]);
        setTotalResults(0);
        setCurrentPage(1);
        setError(null);
        setHasNextPage(false);
    }, []);

    return {
        audios,
        loading,
        error,
        totalResults,
        currentPage,
        hasNextPage,
        searchAudios,
        loadPopularAudios,
        searchAudiosAppend,
        loadPopularAudiosAppend,
        clearAudios
    };
}
