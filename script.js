const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const createGameBtn = document.getElementById('create-game-btn');
const gameInput = document.getElementById('game-input');
const gameTitle = document.getElementById('game-title');
const gameStory = document.getElementById('game-story');
const gameRules = document = document.getElementById('game-rules');
const restartBtn = document.getElementById('restart-btn');
const replayBtn = document.getElementById('replay-btn');
const messageBox = document.getElementById('message-box');

let currentGame = null;

// The API key is required to make calls to the generative model.
// Please get your key from https://aistudio.google.com/ and paste it here.
const apiKey = "AIzaSyBz4-JmZZuTVnlOHycPK4Qu8jG2qP2ofBA";  // Replace with your actual API key

// The base URL for the API call.
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=";

// Resize the canvas to be a square that fits its container
const resizeCanvas = () => {
    const container = document.getElementById('canvas-container');
    const size = Math.min(container.offsetWidth, window.innerHeight * 0.7);
    canvas.width = size;
    canvas.height = size;
    if (currentGame) {
        currentGame.draw();
    }
};

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const showControls = () => {
    restartBtn.style.opacity = '1';
    replayBtn.style.opacity = '1';
};

const hideControls = () => {
    restartBtn.style.opacity = '0';
    replayBtn.style.opacity = '0';
};

const showMessage = (text, color = '#e2e8f0') => {
    messageBox.textContent = text;
    messageBox.style.color = color;
    messageBox.style.opacity = '1';
};

const hideMessage = () => {
    messageBox.style.opacity = '0';
};

// --- API Call to Generate Game Logic ---
const generateGame = async (gameName) => {
    if (!apiKey) {
        console.error("API Key is missing. Please add your API key to the `apiKey` variable in script.js.");
        gameTitle.textContent = 'API Key Required';
        gameStory.textContent = 'Please check the console for instructions on how to add your API key.';
        gameRules.textContent = '';
        hideControls();
        return;
    }
    
    showMessage("Generating game...", '#4299e1');
    hideControls();
    canvas.style.display = 'none';

    // The user's query that is sent to the LLM
    const userQuery = `You MUST generate the game logic for the requested game name and nothing else. The game should be a simple, playable canvas game in JavaScript. The game should be named "${gameName}". Do not generate a different game. If you are unable to generate the requested game, return null for the gameLogic field.

    The output must be a single JSON object with the following structure:
    - "gameTitle": A string for the game's title.
    - "storyline": A string describing the game's story.
    - "rules": A string explaining the game's rules.
    - "gameLogic": A string containing a complete JavaScript function named 'setupGame'.
    
    The 'setupGame' function should return an object with three methods: 'draw', 'reset', and 'replay'. 
    - 'draw' should handle the rendering.
    - 'reset' should reset the game state.
    - 'replay' should reset the game and display a replay message.
    
    The game must use the provided canvas element and its 2D context. Include basic logic for user input via mouse/touch and arrow keys. The game should be self-contained within the 'setupGame' function.
    
    Example for 'Tic Tac Toe' game logic (do not use this exact code):
    function setupGame() {
        let board = ['', '', '', '', '', '', '', '', ''];
        let currentPlayer = 'X';
        let gameOver = false;
        
        // ... all game variables and functions ...

        return {
            draw: function() { ... },
            reset: function() { ... },
            replay: function() { ... }
        };
    }`;

    // Payload for the API call
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "gameTitle": { "type": "STRING" },
                    "storyline": { "type": "STRING" },
                    "rules": { "type": "STRING" },
                    "gameLogic": { "type": "STRING" }
                }
            }
        }
    };

    try {
        const response = await fetch(API_URL + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        console.log("API Response:", result); // Log the full API response
        
        const jsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!jsonString) {
            throw new Error('API response missing content.');
        }

        const gameData = JSON.parse(jsonString);
        console.log("Parsed Game Data:", gameData); // Log the parsed JSON

        if (!gameData.gameLogic || !gameData.gameTitle) {
            throw new Error('Invalid game data received from API.');
        }

        // Create and execute a function from the received string
        const setupGameFunc = new Function('canvas', 'ctx', 'restartBtn', 'replayBtn', 'showControls', 'hideControls', 'showMessage', 'hideMessage', gameData.gameLogic + '; return setupGame(canvas, ctx, restartBtn, replayBtn, showControls, hideControls, showMessage, hideMessage);');
        currentGame = setupGameFunc(canvas, ctx, restartBtn, replayBtn, showControls, hideControls, showMessage, hideMessage);

        gameTitle.textContent = gameData.gameTitle;
        gameStory.textContent = gameData.storyline;
        gameRules.textContent = gameData.rules;
        canvas.style.display = 'block';
        resizeCanvas();

    } catch (error) {
        console.error('Error generating game:', error);
        gameTitle.textContent = 'Error';
        gameStory.textContent = 'Could not generate game logic. Please check the console for details.';
        gameRules.textContent = '';
        hideControls();
    }
};

// --- Event Listener for Create Game Button ---
createGameBtn.addEventListener('click', () => {
    const gameName = gameInput.value.trim();
    if (gameName) {
        generateGame(gameName);
    } else {
        gameTitle.textContent = 'No Game Name Entered';
        gameStory.textContent = 'Please type the name of a game you want to create.';
        gameRules.textContent = '';
    }
});
