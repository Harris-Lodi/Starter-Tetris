document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const scoreDisplay = document.getElementById('score');
    const levelDisplay = document.getElementById('level');
    const nextPieceDisplay = document.getElementById('next-piece');
    const startButton = document.getElementById('start-button');
    const resetButton = document.getElementById('reset-button');
    const closeButton = document.getElementById('close-button');
    const reopenButton = document.getElementById('reopen-button');
    const gameContainer = document.querySelector('.game-container');
    const closedMessage = document.getElementById('closed-message');
    
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    
    let board = [];
    let currentPiece = null;
    let nextPiece = null;
    let score = 0;
    let level = 1;
    let gameInterval = null;
    let isPaused = false;
    let isGameOver = false;
    let isGameClosed = false;
    
    // Tetromino shapes
    const SHAPES = [
        // I
        [[1, 1, 1, 1]],
        // O
        [[1, 1],
         [1, 1]],
        // T
        [[0, 1, 0],
         [1, 1, 1]],
        // S
        [[0, 1, 1],
         [1, 1, 0]],
        // Z
        [[1, 1, 0],
         [0, 1, 1]],
        // J
        [[1, 0, 0],
         [1, 1, 1]],
        // L
        [[0, 0, 1],
         [1, 1, 1]]
    ];
    
    // Colors for each tetromino
    const COLORS = [
        '#9d4edd', // I - Purple
        '#d4af37', // O - Gold
        '#c77dff', // T - Light Purple
        '#e0aaff', // S - Very Light Purple
        '#7209b7', // Z - Dark Purple
        '#560bad', // J - Very Dark Purple
        '#f72585'  // L - Pink
    ];
    
    // Initialize the game board
    function initBoard() {
        board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        gameBoard.innerHTML = '';
        
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                gameBoard.appendChild(cell);
            }
        }
        
        // Initialize next piece display
        nextPieceDisplay.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.classList.add('next-cell');
            nextPieceDisplay.appendChild(cell);
        }
    }
    
    // Create a new tetromino
    function createPiece() {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        return {
            shape: SHAPES[shapeIndex],
            color: COLORS[shapeIndex],
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
            y: 0
        };
    }
    
    // Draw the game board
    function drawBoard() {
        const cells = gameBoard.querySelectorAll('.cell');
        
        // Clear the board
        cells.forEach(cell => {
            cell.classList.remove('filled');
            cell.style.backgroundColor = '';
        });
        
        // Draw the placed pieces
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (board[y][x]) {
                    const index = y * BOARD_WIDTH + x;
                    cells[index].classList.add('filled');
                    cells[index].style.backgroundColor = board[y][x];
                }
            }
        }
        
        // Draw the current piece
        if (currentPiece) {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const boardX = currentPiece.x + x;
                        const boardY = currentPiece.y + y;
                        
                        if (boardY >= 0 && boardY < BOARD_HEIGHT && 
                            boardX >= 0 && boardX < BOARD_WIDTH) {
                            const index = boardY * BOARD_WIDTH + boardX;
                            cells[index].classList.add('filled');
                            cells[index].style.backgroundColor = currentPiece.color;
                        }
                    }
                }
            }
        }
    }
    
    // Draw the next piece
    function drawNextPiece() {
        const cells = nextPieceDisplay.querySelectorAll('.next-cell');
        
        // Clear the next piece display
        cells.forEach(cell => {
            cell.classList.remove('next-filled');
            cell.style.backgroundColor = '';
        });
        
        // Draw the next piece
        if (nextPiece) {
            for (let y = 0; y < nextPiece.shape.length; y++) {
                for (let x = 0; x < nextPiece.shape[y].length; x++) {
                    if (nextPiece.shape[y][x]) {
                        const index = y * 4 + x;
                        if (index < cells.length) {
                            cells[index].classList.add('next-filled');
                            cells[index].style.backgroundColor = nextPiece.color;
                        }
                    }
                }
            }
        }
    }
    
    // Check for collisions
    function checkCollision(piece, offsetX = 0, offsetY = 0, newShape = null) {
        const shape = newShape || piece.shape;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = piece.x + x + offsetX;
                    const newY = piece.y + y + offsetY;
                    
                    if (
                        newX < 0 || 
                        newX >= BOARD_WIDTH || 
                        newY >= BOARD_HEIGHT ||
                        (newY >= 0 && board[newY][newX])
                    ) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Rotate a piece
    function rotatePiece(piece) {
        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = piece.shape[y][x];
            }
        }
        
        return rotated;
    }
    
    // Place a piece on the board
    function placePiece() {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    const boardY = currentPiece.y + y;
                    const boardX = currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        board[boardY][boardX] = currentPiece.color;
                    }
                }
            }
        }
        
        // Check for completed lines
        checkLines();
        
        // Get a new piece
        currentPiece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();
        
        // Check if the game is over
        if (checkCollision(currentPiece)) {
            gameOver();
        }
    }
    
    // Check for completed lines
    function checkLines() {
        let linesCleared = 0;
        
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
                board.splice(y, 1);
                board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check the same line again
            }
        }
        
        if (linesCleared > 0) {
            // Update score
            const points = [0, 40, 100, 300, 1200];
            score += points[linesCleared] * level;
            scoreDisplay.textContent = score;
            
            // Update level
            const newLevel = Math.floor(score / 1000) + 1;
            if (newLevel > level) {
                level = newLevel;
                levelDisplay.textContent = level;
                
                // Increase game speed (doubled from original)
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, (1000 - (level - 1) * 100) / 2);
            }
        }
    }
    
    // Move the current piece
    function movePiece(direction) {
        if (!currentPiece || isPaused || isGameOver || isGameClosed) return;
        
        let offsetX = 0;
        let offsetY = 0;
        
        switch (direction) {
            case 'left':
                offsetX = -1;
                break;
            case 'right':
                offsetX = 1;
                break;
            case 'down':
                offsetY = 1;
                break;
        }
        
        if (!checkCollision(currentPiece, offsetX, offsetY)) {
            currentPiece.x += offsetX;
            currentPiece.y += offsetY;
            drawBoard();
        } else if (direction === 'down') {
            placePiece();
            drawBoard();
        }
    }
    
    // Rotate the current piece
    function rotateCurrentPiece() {
        if (!currentPiece || isPaused || isGameOver || isGameClosed) return;
        
        const rotated = rotatePiece(currentPiece);
        
        if (!checkCollision(currentPiece, 0, 0, rotated)) {
            currentPiece.shape = rotated;
            drawBoard();
        }
    }
    
    // Hard drop
    function hardDrop() {
        if (!currentPiece || isPaused || isGameOver || isGameClosed) return;
        
        while (!checkCollision(currentPiece, 0, 1)) {
            currentPiece.y++;
            score += 2;
        }
        
        placePiece();
        drawBoard();
        scoreDisplay.textContent = score;
    }
    
    // Toggle pause
    function togglePause() {
        if (isGameOver || isGameClosed) return;
        
        isPaused = !isPaused;
        startButton.textContent = isPaused ? 'Resume' : 'Pause';
    }
    
    // Game over
    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        startButton.textContent = 'New Game';
        alert(`Game Over! Your score: ${score}`);
    }
    
    // Reset the game
    function resetGame() {
        clearInterval(gameInterval);
        score = 0;
        level = 1;
        isPaused = false;
        isGameOver = false;
        scoreDisplay.textContent = score;
        levelDisplay.textContent = level;
        startButton.textContent = 'Start Game';
        initBoard();
    }
    
    // Close the game
    function closeGame() {
        clearInterval(gameInterval);
        isGameClosed = true;
        gameContainer.classList.add('hidden');
        closedMessage.classList.remove('hidden');
    }
    
    // Reopen the game
    function reopenGame() {
        isGameClosed = false;
        gameContainer.classList.remove('hidden');
        closedMessage.classList.add('hidden');
        resetGame();
    }
    
    // Start a new game
    function startGame() {
        if (isGameOver) {
            resetGame();
        }
        
        if (isPaused) {
            isPaused = false;
            startButton.textContent = 'Pause';
            gameInterval = setInterval(gameLoop, (1000 - (level - 1) * 100) / 2);
            return;
        }
        
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        
        currentPiece = createPiece();
        nextPiece = createPiece();
        drawNextPiece();
        drawBoard();
        
        // Set game speed (doubled from original)
        gameInterval = setInterval(gameLoop, (1000 - (level - 1) * 100) / 2);
        startButton.textContent = 'Pause';
    }
    
    // Game loop
    function gameLoop() {
        if (isPaused || isGameOver || isGameClosed) return;
        
        movePiece('down');
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowLeft':
                movePiece('left');
                break;
            case 'ArrowRight':
                movePiece('right');
                break;
            case 'ArrowDown':
                movePiece('down');
                break;
            case 'ArrowUp':
                rotateCurrentPiece();
                break;
            case ' ':
                e.preventDefault();
                hardDrop();
                break;
            case 'p':
            case 'P':
                togglePause();
                break;
        }
    });
    
    // Button event listeners
    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);
    closeButton.addEventListener('click', closeGame);
    reopenButton.addEventListener('click', reopenGame);
    
    // Initialize the game
    initBoard();
});