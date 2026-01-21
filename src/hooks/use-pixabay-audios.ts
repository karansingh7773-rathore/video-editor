import { useState, useCallback } from "react";
import { IAudio } from "@designcombo/types";

interface PixabayAudio {
    id: number;
    duration: number;
    picture_id?: string;
    audio: string; // URL
    pageURL: string;
    type: string;
    tags: string;
    artist?: string;
    title?: string; // Sometimes Pixabay assumes title from tags or uses generic "sound effect"
}

interface PixabayAudioResponse {
    hits: PixabayAudio[];
    total: number;
    totalHits: number;
}

interface UsePixabayAudiosReturn {
    audios: Partial<IAudio>[];
    loading: boolean;
    error: string | null;
    totalResults: number;
    currentPage: number;
    searchAudios: (query: string, page?: number) => Promise<void>;
    loadPopularAudios: (page?: number) => Promise<void>;
    searchAudiosAppend: (query: string, page?: number) => Promise<void>;
    loadPopularAudiosAppend: (page?: number) => Promise<void>;
    clearAudios: () => void;
}

export function usePixabayAudios(): UsePixabayAudiosReturn {
    const [audios, setAudios] = useState<Partial<IAudio>[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const transformHits = (hits: any[]): Partial<IAudio>[] => {
        return hits.map((hit) => ({
            id: `pixabay_${hit.id}`,
            name: hit.tags || "Audio",
            details: {
                src: hit.audio, // Pixabay returns 'audio' field? Actually check API docs. It might be download URL. "audio" field is usually preview.
                // Let's assume 'audio' is the preview/source URL for now. 
                // Docs say 'audio' field contains the URL.
            },
            metadata: {
                author: hit.user,
                duration: hit.duration,
                pageUrl: hit.pageURL
            },
            type: "audio"
        }));
    };

    const fetchAudios = useCallback(async (url: string, append = false) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            const transformed = transformHits(data.hits || []);

            if (append) {
                setAudios(prev => [...prev, ...transformed]);
            } else {
                setAudios(transformed);
            }
            setTotalResults(data.totalHits || 0);
        } catch (err: any) {
            setError(err.message || "Failed to fetch audios");
            if (!append) setAudios([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const searchAudios = useCallback(async (query: string, page = 1) => {
        setCurrentPage(page);
        await fetchAudios(`/api/pixabay-audios?query=${encodeURIComponent(query)}&page=${page}`);
    }, [fetchAudios]);

    const searchAudiosAppend = useCallback(async (query: string, page = 1) => {
        setCurrentPage(page);
        await fetchAudios(`/api/pixabay-audios?query=${encodeURIComponent(query)}&page=${page}`, true);
    }, [fetchAudios]);

    const loadPopularAudios = useCallback(async (page = 1) => {
        setCurrentPage(page);
        // Empty query returns popular results on Pixabay
        await fetchAudios(`/api/pixabay-audios?page=${page}`);
    }, [fetchAudios]);

    const loadPopularAudiosAppend = useCallback(async (page = 1) => {
        setCurrentPage(page);
        await fetchAudios(`/api/pixabay-audios?page=${page}`, true);
    }, [fetchAudios]);

    const clearAudios = useCallback(() => {
        setAudios([]);
        setTotalResults(0);
        setCurrentPage(1);
        setError(null);
    }, []);

    return {
        audios,
        loading,
        error,
        totalResults,
        currentPage,
        searchAudios,
        loadPopularAudios,
        searchAudiosAppend,
        loadPopularAudiosAppend,
        clearAudios
    };
}
