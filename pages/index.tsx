import _ from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "../hooks/useInterval";

function Cell(props: { isCurrent: boolean; isFood: boolean }): JSX.Element {
  const { isCurrent, isFood } = props;
  // Why should I need state here?
  const [color, setColor] = useState<string | undefined>(undefined);

  // WHY???
  useEffect(() => {
    setColor(isCurrent ? "blue" : isFood ? "red" : undefined);
  }, []);

  return (
    <div
      style={{
        width: 30,
        height: 30,
        border: "1px solid #333",
        background: color,
      }}
    ></div>
  );
}

function Grid(props: {
  width: number;
  height: number;
  current: Position;
  food: Position;
}) {
  // Seems like I need a useState for this? Could break into Cell component with
  // state?
  return (
    <div>
      {_.range(props.height).map((i) => {
        return (
          <div style={{ display: "flex", flexDirection: "row" }} key={i}>
            {_.range(props.width).map((j) => {
              const isFood = j === props.food.x && i === props.food.y;
              const isCurrent = j === props.current.x && i === props.current.y;

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

function getFoodPosition(
  position: Position,
  bounds: { width: number; height: number }
): Position {
  let x: number;
  let y: number;

  do {
    x = Math.floor(Math.random() * bounds.width);
    y = Math.floor(Math.random() * bounds.height);
  } while (position.x !== x && position.y !== y);

  return { x, y };
}

export default function Home() {
  const [points, setPoints] = useState(0);

  const [gridDimensions, setGridDimentions] = useState({
    width: 10,
    height: 10,
  });
  const [fail, setFail] = useState<boolean>(false);
  const [dot, setDot] = useState<Position>({
    x: 0,
    y: 0,
  });

  const [highScore, setHighScore] = useState(0);

  // Default to move right
  const [lastKey, setLastKey] = useState<string>("l");

  const [food, setFood] = useState<Position>(
    getFoodPosition(dot, gridDimensions)
  );

  const moveSnake = useCallback(() => {
    const position = { ...dot };
    if (lastKey === "j") {
      position.y++;
    } else if (lastKey === "k") {
      position.y--;
    } else if (lastKey === "l") {
      position.x++;
    } else if (lastKey === "h") {
      position.x--;
    }

    if (isOutOfBounds(position, gridDimensions)) {
      setFail(true);
      if (points > highScore) {
        setHighScore(points);
      }
    } else {
      setDot(position);
      if (food.x === position.x && food.y === position.y) {
        // Eat
        setFood(getFoodPosition(dot, gridDimensions));
        setPoints(points + 1);
      }
    }
  }, [dot, setDot, setFail, lastKey]);

  const updateLastKey = useCallback(
    (event: KeyboardEvent) => {
      const keys = { j: true, k: true, l: true, h: true };

      if (event.key in keys) {
        setLastKey(event.key);
      }
    },
    [setLastKey]
  );

  const reset = useCallback(() => {
    const initialPosition = { x: 0, y: 0 };
    setDot(initialPosition);
    setFood(getFoodPosition(initialPosition, gridDimensions));
    setFail(false);
    setLastKey("l");
    setPoints(0);
  }, [setFail, setDot, dot, gridDimensions]);

  useEffect(() => {
    document.addEventListener("keydown", updateLastKey);
    return () => {
      document.removeEventListener("keydown", updateLastKey);
    };
  }, [updateLastKey]);

	// TODO: Could use the example of multiple intervals that influence each
	// other, could slowly decrease the delay over time 🤔
  useInterval(() => {
    // Why still ticking after fail?
    moveSnake();
  }, 200);

  // useInterval is better?
  // useEffect(() => {
  //   const intervalHandle = !fail ? setInterval(moveSnake, 100) : undefined;
  //   return () => (intervalHandle ? clearInterval(intervalHandle) : undefined);
  // }, [moveSnake, fail]);

  return !fail ? (
    <>
      <Grid width={10} height={10} current={dot} food={food} />
      <span>Points: {points}</span>
    </>
  ) : (
    <>
			<button onClick={() => reset()}>Reset!</button>
			This round: {points}
			High Score: {highScore}
    </>
  );
}
