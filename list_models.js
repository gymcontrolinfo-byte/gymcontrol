import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDha6mQeOCNfPGZZcegdDskRhRGgCjljjE";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        // The JS SDK doesn't have a direct listModels method in the same way Python does, 
        // but it might have it in the client or we can use fetch.
        // Actually, the official recommended way is to use the Rest API for listing if not in SDK.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
