# Sudoku Game

A modern, interactive Sudoku puzzle game built with vanilla JavaScript, HTML, and CSS. Features a clean UI with multiple difficulty levels, live validation, and a comprehensive set of game features.

## Features

- **Three Difficulty Levels**: Easy, Medium, and Hard puzzles
- **Live Validation**: Real-time checking of entered numbers
- **Notes Mode**: Add candidate numbers to cells for solving complex puzzles
- **Timer**: Track your solving time
- **Mistake Counter**: Monitor your errors
- **Undo/Redo**: Full game history management
- **Auto-Solve**: Instant puzzle solution
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean interface with smooth animations and visual effects

## How to Play

1. **Select a Difficulty**: Choose between Easy, Medium, or Hard
2. **Fill the Grid**: Click on a cell and use the number pad to enter numbers 1-9
3. **Use Notes**: Enable Notes mode to add candidate numbers to cells
4. **Check Your Work**: Enable Live Validation to see conflicts in real-time
5. **Complete the Puzzle**: Fill all cells correctly to win

## Controls

### Mouse/Touch
- Click any cell to select it
- Use the number pad buttons to enter numbers
- Click the erase button to clear a cell
- Use the undo/redo buttons to navigate game history

### Keyboard Shortcuts
- **Number Keys (1-9)**: Enter numbers in selected cell
- **Delete/Backspace**: Clear selected cell
- **Arrow Keys**: Navigate between cells
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **N**: Toggle Notes mode
- **L**: Toggle Live validation

## File Structure

```
sudoku-game/
├── index.html      # Main HTML structure
├── script.js       # Game logic and interactions
├── style.css       # Styling and visual design
└── README.md       # This file
```

## Technical Details

- **Pure Vanilla JavaScript**: No external dependencies
- **Responsive CSS Grid**: Flexible layout system
- **Modern CSS Features**: CSS Grid, Flexbox, CSS Variables
- **Accessibility**: ARIA labels and semantic HTML
- **Performance Optimized**: Efficient DOM manipulation and event handling

## Game Features Explained

### Difficulty Levels
- **Easy**: 40 clues (61% filled)
- **Medium**: 30 clues (46% filled)  
- **Hard**: 24 clues (37% filled)

### Live Validation
When enabled, the game highlights:
- **Red cells**: Numbers that conflict with Sudoku rules
- **Gray cells**: Same numbers in the same row, column, or 3x3 box

### Notes Mode
Allows you to add small candidate numbers in cells to help track possibilities while solving complex puzzles.

### Timer
Starts automatically when you make your first move and stops when the puzzle is completed.

## Getting Started

1. Clone or download the repository
2. Open `index.html` in a web browser
3. Start playing!

No build process or server required - simply open the HTML file in any modern web browser.

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

This project is open source and available under the MIT License.
