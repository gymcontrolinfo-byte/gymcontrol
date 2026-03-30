import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const getModel = (modelName = "gemini-2.5-flash") => {
    // Current model for this key is gemini-2.5-flash, only in v1beta for now.
    return genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1beta' });
};

export const generateWorkoutPlan = async (userProfile, selectedMuscles, availableExercises, language = 'en') => {
    let model = getModel("gemini-2.5-flash");

    const prompt = `
    CRITICAL: YOU MUST RESPOND IN ${language.startsWith('es') ? 'SPANISH (ESPAÑOL)' : 'ENGLISH'}.
    - All text intended for the user (plan "name" and "coachAdvice") MUST BE in ${language.startsWith('es') ? 'Spanish' : 'English'}.
    - The JSON structure itself (keys) must remain in English as defined below.

    You are a professional fitness coach assistant. 
    Create a personalized workout routine for a user with the following profile:
    - Age: ${userProfile.age}
    - Height: ${userProfile.height} cm
    - Weight: ${userProfile.weight} kg
    - Sex: ${userProfile.sex}
    - Training Frequency: ${userProfile.frequency} sessions per week
    - Injuries/Pains: ${userProfile.injuries || "None"}

    Target Muscle Groups: ${selectedMuscles.join(", ")}

    Available exercises in the user's library (use ONLY these exercises):
    ${availableExercises.map(ex => `- ID: ${ex.id}, Name: ${ex.name}, Target Muscle: ${ex.muscle}, Type: ${ex.type}`).join("\n")}

    - The exercise names MUST match the "Name" from the available exercises list provided.

    If the user didn't specify muscle groups, suggest a balanced workout based on their profile.
    
    If there are no exercises for a specific muscle group, skip that group or suggest the closest alternative from the available exercises.

    Response format MUST be a valid JSON object with the following structure:
    {
        "name": "Name of the workout session",
        "sections": [
            {
                "type": "standard", // "standard", "superset" (2 exercises), or "triset" (3 exercises)
                "exercises": [
                    {
                        "exerciseId": "The ID of the exercise from the list",
                        "name": "The Name of the exercise",
                        "sets": "number of sets (e.g. 3)",
                        "reps": "number of reps or time (e.g. 12 or 30s)",
                        "rest": "rest time after each COMPLETE set of the section in seconds (e.g. 60-90)"
                    }
                ],
                "coachAdvice": "Short note specific to this section if needed"
            }
        ],
        "coachAdvice": "General advice from the coach based on the user profile"
    }

    Return ONLY the JSON object. Do not include any markdown formatting or extra text.
    `;

    try {
        let result;
        try {
            result = await model.generateContent(prompt);
        } catch (e) {
            console.warn("Retrying with gemini-2.0-flash-exp fallback...", e);
            model = getModel("gemini-2.0-flash-exp");
            result = await model.generateContent(prompt);
        }

        const response = await result.response;
        const text = response.text();
        
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating workout plan:", error);
        throw error;
    }
};

export const suggestMuscles = async (userProfile, language = 'en') => {
    let model = getModel("gemini-2.5-flash");

    const prompt = `
    CRITICAL: YOU MUST RESPOND IN ${language.startsWith('es') ? 'SPANISH' : 'ENGLISH'}.
    - The response MUST be a JSON array of strings in ${language.startsWith('es') ? 'Spanish' : 'English'}.

    Based on the following user profile, suggest 2 or 3 muscle groups they should train today for a balanced routine.
    Profile:
    - Age: ${userProfile.age}
    - Sex: ${userProfile.sex}
    - Frequency: ${userProfile.frequency}
    - Injuries: ${userProfile.injuries || "None"}

    Available Muscle Groups: Chest, Triceps, Back, Biceps, Front Leg, Back Leg, Leg, Shoulder, Forearm.

    Response format MUST be a valid JSON array of strings, e.g. ["Chest", "Triceps"].
    Return ONLY the JSON array.
    `;

    try {
        let result;
        try {
            result = await model.generateContent(prompt);
        } catch (e) {
            model = getModel("gemini-2.0-flash-exp");
            result = await model.generateContent(prompt);
        }
        
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error suggesting muscles:", error);
        return ["Leg", "Core"]; // Fallback
    }
};

export const getExerciseAdvice = async (exerciseName, language = 'en') => {
    let model = getModel("gemini-2.5-flash");

    const prompt = `
    CRITICAL: YOU MUST RESPOND IN ${language.startsWith('es') ? 'SPANISH' : 'ENGLISH'}.
    
    You are an expert fitness coach. 
    Give 3 short, high-impact technical tips or cues for the following exercise: "${exerciseName}".
    
    Be concise. Use bullet points. 
    The goal is to help the user perform the exercise with perfect form and avoid injury.
    
    Response format: Plain text with bullets.
    `;

    try {
        let result;
        try {
            result = await model.generateContent(prompt);
        } catch (e) {
            model = getModel("gemini-2.0-flash-exp");
            result = await model.generateContent(prompt);
        }
        
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Error getting exercise advice:", error);
        return language.startsWith('es') ? "No se pudo obtener consejos en este momento." : "Could not get advice at this time.";
    }
};

