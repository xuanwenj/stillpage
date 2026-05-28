import { useEffect, useState } from "react";
import { useToast } from "../toast";

export const FocusTimer = () => {
  const [timeLeft, setTimeLeft] = useState(0); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const toast = useToast();
  const [value, setValue] = useState(1); // Default value in minutes
  function setTime() {
    setTimeLeft(25 * 60);
  }
  function handleTimerStart() {
    if (!(timeLeft <= 0)) {
      setTimeLeft(value * 60);
      setIsRunning(true);
    } else {
      toast.error("Please set the timer before starting.");
    }
  }

  function handleTimerReset() {
    setIsRunning(false);
    setTimeLeft(0);
  }

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div>
      <p>
        {minutes}:{seconds}
      </p>
      <button onClick={handleTimerStart}>Start</button>
      <button onClick={handleTimerReset}>Reset</button>
      <button onClick={setTime}>25 mins </button>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        min="1"
        max="60"
      />
    </div>
  );
};
