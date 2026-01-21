import Draggable from "@/components/shared/draggable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dispatch } from "@designcombo/events";
import { ADD_AUDIO } from "@designcombo/state";
import { IAudio } from "@designcombo/types";
import { Music, Search, Loader2, PlusCircle, PlayCircle, PauseCircle } from "lucide-react";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import React, { useState, useEffect, useRef } from "react";
import { generateId } from "@designcombo/timeline";
import { useFreesound } from "@/hooks/use-freesound";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Audios = () => {
  const isDraggingOverTimeline = useIsDraggingOverTimeline();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const {
    audios,
    loading,
    error,
    currentPage,
    hasNextPage,
    searchAudios,
    loadPopularAudios,
    searchAudiosAppend,
    loadPopularAudiosAppend,
    clearAudios
  } = useFreesound();

  // Load popular audios on mount
  useEffect(() => {
    loadPopularAudios();
  }, [loadPopularAudios]);

  const handleAddAudio = (payload: Partial<IAudio>) => {
    payload.id = generateId();
    dispatch(ADD_AUDIO, {
      payload,
      options: {}
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      loadPopularAudios();
      return;
    }
    searchAudios(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    if (searchQuery.trim()) {
      searchAudiosAppend(searchQuery, nextPage);
    } else {
      loadPopularAudiosAppend(nextPage);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    clearAudios();
    loadPopularAudios();
  };

  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-1 flex-col max-w-full">
      <div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
        Audios
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pr-10"
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
          </Button>
        </div>
        {searchQuery && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearSearch}
            disabled={loading}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 pb-2">
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
            {error.includes("API key")
              ? "Freesound API key missing. Please configure FREESOUND_API_KEY."
              : error}
          </div>
        </div>
      )}

      {/* Audio List */}
      <ScrollArea className="flex-1 h-[calc(100%-125px)] max-w-full">
        <div className="flex flex-col px-2 gap-1">
          {audios.map((audio, index) => (
            <AudioItem
              key={audio.id || index}
              shouldDisplayPreview={!isDraggingOverTimeline}
              handleAddAudio={handleAddAudio}
              audio={audio}
              formatDuration={formatDuration}
              isPlaying={currentlyPlayingId === audio.id}
              onPlay={(id) => setCurrentlyPlayingId(id)}
              onStop={() => setCurrentlyPlayingId(null)}
            />
          ))}

          {loading && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {hasNextPage && !loading && (
            <div className="flex justify-center p-4">
              <Button variant="outline" size="sm" onClick={handleLoadMore}>
                Load More
              </Button>
            </div>
          )}

          {!loading && audios.length === 0 && !error && (
            <div className="text-center text-muted-foreground p-4 text-sm">
              No audio found. Try a different search.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const AudioItem = ({
  handleAddAudio,
  audio,
  shouldDisplayPreview,
  formatDuration,
  isPlaying,
  onPlay,
  onStop
}: {
  handleAddAudio: (payload: Partial<IAudio>) => void;
  audio: Partial<IAudio>;
  shouldDisplayPreview: boolean;
  formatDuration: (seconds: number) => string;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onStop: () => void;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const style = React.useMemo(
    () => ({
      backgroundImage:
        "url(https://cdn.designcombo.dev/thumbnails/music-preview.png)",
      backgroundSize: "cover",
      width: "70px",
      height: "70px"
    }),
    []
  );

  // Handle play/pause when isPlaying changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => { });
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isPlaying]);

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      onStop();
    } else {
      onPlay(audio.id || "");
    }
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleAddAudio(audio);
  };

  const handleAudioEnded = () => {
    onStop();
  };

  return (
    <Draggable
      data={audio}
      renderCustomPreview={<div style={style} />}
      shouldDisplayPreview={shouldDisplayPreview}
    >
      <div
        draggable={false}
        onClick={handlePlayToggle}
        style={{
          display: "grid",
          gridTemplateColumns: "48px 1fr auto"
        }}
        className="flex cursor-pointer gap-4 py-2 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors items-center"
      >
        {/* Play/Pause Icon */}
        <div className="flex h-12 w-12 items-center justify-center bg-zinc-200 dark:bg-zinc-800 rounded-md relative">
          {isPlaying ? (
            <PauseCircle className="h-6 w-6 text-green-500" />
          ) : (
            <PlayCircle className="h-6 w-6 text-zinc-500 hover:text-green-500 transition-colors" />
          )}
        </div>

        {/* Audio Info */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="truncate font-medium text-sm">{audio.name}</div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="truncate">
              {audio.metadata?.author || "Unknown"}
            </span>
            {audio.metadata?.duration && (
              <span>• {formatDuration(audio.metadata.duration)}</span>
            )}
          </div>
        </div>

        {/* Add Button */}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-green-500/20"
          onClick={handleAdd}
          title="Add to timeline"
        >
          <PlusCircle className="h-5 w-5 text-zinc-500 hover:text-green-500" />
        </Button>

        {/* Hidden Audio Element for Preview */}
        <audio
          ref={audioRef}
          src={audio.details?.src}
          onEnded={handleAudioEnded}
          preload="none"
        />
      </div>
    </Draggable>
  );
};
