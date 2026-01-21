import { IAudio } from "@designcombo/types";

export const AUDIOS = [
    {
        id: "audio_1",
        details: {
            src: "https://cdn.designcombo.dev/audio/OpenAI%20CEO%20on%20Artificial%20Intelligence%20Changing%20Society.mp3"
        },
        name: "Open AI",
        type: "audio",
        metadata: {
            author: "Open AI"
        }
    },
    {
        id: "audio_2",
        details: {
            src: "https://cdn.designcombo.dev/audio/Dawn%20of%20change.mp3"
        },
        name: "Dawn of change",
        type: "audio",
        metadata: {
            author: "Roman Senyk"
        }
    },
    {
        id: "audio_3",
        details: {
            src: "https://cdn.designcombo.dev/audio/Hope.mp3"
        },
        name: "Hope",
        type: "audio",
        metadata: {
            author: "Hugo Dujardin"
        }
    },
    {
        id: "audio_4",
        details: {
            src: "https://cdn.designcombo.dev/audio/Tenderness.mp3"
        },
        name: "Tenderness",
        type: "audio",
        metadata: {
            author: "Benjamin Tissot"
        }
    },
    {
        id: "audio_5",
        details: {
            src: "https://cdn.designcombo.dev/audio/Piano%20Moment.mp3"
        },
        name: "Piano moment",
        type: "audio",
        metadata: {
            author: "Benjamin Tissot"
        }
    }
] as Partial<IAudio>[];
