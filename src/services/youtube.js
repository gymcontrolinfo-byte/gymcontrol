
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
        const response = await fetch(`https://noembed.com/embed?url=${url}`);
        const data = await response.json();
        return data.title || null;
    } catch (e) {
        console.error("Failed to fetch video title", e);
        return null;
    }
};
