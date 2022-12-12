import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "../hooks/useInterval";

const CELL_SIZE = 20;

function Cell(props: { isCurrent: boolean; isFood: boolean }): JSX.Element {
  const { isCurrent, isFood } = props;
  // Why should I need state here?
  const [styles, setStyles] = useState<
    | {
        background: string | undefined;
        width: number | undefined;
        height: number | undefined;
        border: string | undefined;
      }
    | undefined
  >(undefined);

  // Refactor to prop
  const cellSize = CELL_SIZE;

  // WHY???
  useEffect(() => {
    setStyles({
      background: isCurrent ? "blue" : isFood ? "red" : undefined,
      width: isCurrent ? cellSize : isFood ? cellSize * 0.75 : undefined,
      height: isCurrent ? cellSize : isFood ? cellSize * 0.75 : undefined,
      border: isCurrent ? "1px solid #111" : undefined,
    });
  }, []);

  return (
    <div
      style={{
        width: cellSize,
        height: cellSize,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={styles}></div>
    </div>
  );
}

function Grid(props: {
  width: number;
  height: number;
  current: Array<Position>;
  food: Position;
}) {
  // Pre-calculate the positions that are the snake
  // Crappy for now
  const snakeCoordinates = props.current.map((dot) => {
    return `${dot.x}-${dot.y}`;
  });

  return (
    <div style={{ border: "1px solid #333", width: props.width * CELL_SIZE }}>
      {_.range(props.height).map((i) => {
        return (
          <div
            style={{ display: "flex", flexGrow: 0, flexDirection: "row" }}
            key={i}
          >
            {_.range(props.width).map((j) => {
              const isFood = j === props.food.x && i === props.food.y;
              // const isCurrent = j === props.current.x && i === props.current.y;
              const isCurrent = snakeCoordinates.includes(`${j}-${i}`);

              // Important to prioritize the current over food to avoid jank
              // with "eating"
              return (
                <Cell
                  key={`${i}-${j}-${isCurrent}-${isFood}`}
                  isCurrent={isCurrent}
                  isFood={isFood}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

type Position = { x: number; y: number };

function isOutOfBounds(
  position: Position,
  bounds: { width: number; height: number }
) {
  return (
    position.x > bounds.width - 1 ||
    position.x < 0 ||
    position.y > bounds.height - 1 ||
    position.y < 0
  );
}

function positionsAreSame(pos1: Position, pos2: Position) {
  return pos1.x == pos2.x && pos1.y == pos2.y;
}

function getFoodPosition(
  positions: Array<Position>,
  bounds: { width: number; height: number }
): Position {
  let x: number;
  let y: number;

  do {
    x = Math.floor(Math.random() * bounds.width);
    y = Math.floor(Math.random() * bounds.height);
  } while (positions.some((p) => positionsAreSame(p, { x, y })));

  return { x, y };
}

function getSnakeInitialPosition() {
  return [
    {
      x: 2,
      y: 0,
    },
    {
      x: 1,
      y: 0,
    },
    {
      x: 0,
      y: 0,
    },
  ];
}

// Modifies in place 😬
function lineUpDots(head: Position, tail: Position, direction: Direction) {
  const yDiff = head.y - tail.y;
  const xDiff = head.x - tail.x;

  let previousDirection = direction;

  if (xDiff && yDiff) {
    // Diagonal, move to previous head
    if (direction === "down") {
      // tail = { x: head.x, y: head.y - 1 };
      previousDirection = tail.x > head.x ? "left" : "right";
      tail.x = head.x;
      tail.y = head.y - 1;
    } else if (direction === "up") {
      // tail = { x: head.x, y: head.y + 1 };
      previousDirection = tail.x > head.x ? "left" : "right";
      tail.x = head.x;
      tail.y = head.y + 1;
    } else if (direction === "left") {
      // tail = { x: head.x + 1, y: head.y };
      previousDirection = tail.y > head.y ? "up" : "down";
      tail.x = head.x + 1;
      tail.y = head.y;
    } else if (direction === "right") {
      // tail = { x: head.x - 1, y: head.y };
      previousDirection = tail.y > head.y ? "up" : "down";
      tail.x = head.x - 1;
      tail.y = head.y;
    } else {
      // unreachable
    }
  } else if (xDiff) {
    // Should always be 1?
    const xDelta = Math.abs(xDiff);
    if (xDiff > 0) {
      tail.x += xDelta - 1;
      previousDirection = "right";
    } else if (xDiff < 0) {
      tail.x -= xDelta - 1;
      previousDirection = "left";
    }
  } else if (yDiff) {
    // Should always be 1?
    const yDelta = Math.abs(yDiff);
    if (yDiff > 0) {
      previousDirection = "down";
      tail.y += yDelta - 1;
    } else if (yDiff < 0) {
      previousDirection = "up";
      tail.y -= yDelta - 1;
    }
  } else {
    // We don't allow backwards which I think this is 👇
  }
  return previousDirection;
}

type Direction = "down" | "left" | "right" | "up";

function updateSnake(snake: Array<Position>, direction: Direction) {
  // Head already moved, then ensure the body follows
  let prevDirection = direction;
  for (let i = 1; i < snake.length; i++) {
    prevDirection = lineUpDots(snake[i - 1], snake[i], prevDirection);
  }
}

const keyToDirectionMap: Record<string, Direction> = {
  l: "right",
  k: "up",
  j: "down",
  h: "left",
  ArrowDown: "down",
  ArrowUp: "up",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export default function Home() {
  const [points, setPoints] = useState(0);

  // Could have a live grid dimensions to make it even harder? Like a heart beat
  // shrinking and growing 🤔
  const [gridDimensions, _setGridDimentions] = useState({
    width: 25,
    height: 25,
  });

  const [fail, setFail] = useState<boolean>(true);

  const [snake, setSnake] = useState<Array<Position>>(
    getSnakeInitialPosition()
  );

  const [highScore, setHighScore] = useState(0);

  // Default to move right
  const [lastKey, setLastKey] = useState<string>("l");

  const [food, setFood] = useState<Position>(() => {
    return getFoodPosition(getSnakeInitialPosition(), gridDimensions);
  });

  // Maybe useCallback?
  function eatFood(updatedSnake: Array<Position>) {
    setFood(getFoodPosition(updatedSnake, gridDimensions));
    setPoints(points + 1);
  }

  const moveSnake = useCallback(() => {
    console.time("move");
    // Need to handle multiple blocks
    const newSnake = _.cloneDeep(snake);
    // Bad manipulation of underlying object 😬
    const head = newSnake[0];

    if (lastKey === "j" || lastKey === "ArrowDown") {
      head.y++;
    } else if (lastKey === "k" || lastKey === "ArrowUp") {
      head.y--;
    } else if (lastKey === "l" || lastKey === "ArrowRight") {
      head.x++;
    } else if (lastKey === "h" || lastKey === "ArrowLeft") {
      head.x--;
    }

    updateSnake(newSnake, keyToDirectionMap[lastKey]);

    const snakePositions = new Set(newSnake.map((dot) => `${dot.x}${dot.y}`));

    if (
      isOutOfBounds(head, gridDimensions) ||
      snakePositions.size !== newSnake.length
    ) {
      setFail(true);
      if (points > highScore) {
        setHighScore(points);
      }
    } else {
      if (food.x === head.x && food.y === head.y) {
        // Eat
        const updatedSnake = [...newSnake, snake[snake.length - 1]];
        setSnake(updatedSnake);
        eatFood(updatedSnake);
      } else {
        setSnake(newSnake);
      }
    }
    console.timeEnd("move");
  }, [snake, setSnake, setFail, lastKey]);

  const updateLastKey = useCallback(
    (event: KeyboardEvent) => {
      console.log(event.key);
      if (fail && event.key === "Enter") {
        reset();
        return;
      }

      const supportedKeys = {
        j: true,
        k: true,
        l: true,
        h: true,
        ArrowUp: true,
        ArrowDown: true,
        ArrowRight: true,
        ArrowLeft: true,
      };

      if (event.key in supportedKeys) {
        // TODO: Should be better setup?
        if (
          (lastKey === "j" || lastKey == "ArrowDown") &&
          (event.key == "k" || event.key == "ArrowUp")
        ) {
          return;
        }

        if (
          (lastKey === "k" || lastKey == "ArrowUp") &&
          (event.key == "j" || event.key == "ArrowDown")
        ) {
          return;
        }

        if (
          (lastKey === "l" || lastKey == "ArrowRight") &&
          (event.key == "h" || event.key == "ArrowLeft")
        ) {
          return;
        }

        if (
          (lastKey === "h" || lastKey == "ArrowLeft") &&
          (event.key == "l" || event.key == "ArrowRight")
        ) {
          return;
        }
        setLastKey(event.key);
      }
    },
    [setLastKey, lastKey, fail]
  );

  const reset = useCallback(() => {
    setSnake(getSnakeInitialPosition());
    setFood(getFoodPosition(getSnakeInitialPosition(), gridDimensions));
    setFail(false);
    setLastKey("l");
    setPoints(0);
  }, [setFail, setSnake, snake, gridDimensions]);

  useEffect(() => {
    document.addEventListener("keydown", updateLastKey);
    return () => {
      document.removeEventListener("keydown", updateLastKey);
    };
  }, [updateLastKey]);

  // TODO: Could use the example of multiple intervals that influence each
  // other, could slowly decrease the delay over time 🤔
  useInterval(
    () => {
      moveSnake();
    },
    fail ? undefined : 80
  );

  return !fail ? (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <Grid
        width={gridDimensions.width}
        height={gridDimensions.height}
        current={snake}
        food={food}
      />
      <span>Points: {points}</span>
    </div>
  ) : (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div>This round: {points}</div>
      <div style={{ marginBottom: 20 }}>High Score: {highScore}</div>
      <button onClick={() => reset()}>Start!</button>
    </div>
  );
}
