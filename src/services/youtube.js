
export const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const getThumbnail = (videoId) => {
    if (!videoId) return null;
    // mqdefault is 320x180 (16:9), usually sufficient and always available
    // maxresdefault is 1280x720 but sometimes missing
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

export const validateYoutubeUrl = (url) => {
    return !!getYoutubeId(url);
};

export const getVideoTitle = async (url) => {
    try {
        // Normalize URL to standard watch format for noembed compatibility
        const videoId = getYoutubeId(url);
        if (!videoId) return null;

        const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(`https://noembed.com/embed?url=${standardUrl}`);
        const data = await response.json();
        return data.title || null;
    } catch (e) {
        console.error("Failed to fetch video title", e);
        return null;
    }
};
