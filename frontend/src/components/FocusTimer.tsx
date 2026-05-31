import { useEffect, useState } from "react";
import { useToast } from "../toast";
import "../styles/focustimer.css";

export const FocusTimer = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const toast = useToast();
  const [customMinutes, setCustomMinutes] = useState(1);

  function handleTimerStart(time: number) {
    if (time <= 0) {
      toast.error("Please enter a time greater than 0");
      return;
    }
    setTimeLeft(time * 60);
    setIsRunning(true);
  }

  function handleTimerReset() {
    setIsRunning(false);
    setTimeLeft(0);
  }
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      toast.success("Timer completed! Great work!");
      playAlarm();
    }
  }, [timeLeft]);

  function playAlarm() {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.value = 440;
    oscillator.start();

    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + 1.5,
    );

    oscillator.stop(audioCtx.currentTime + 1.5);
  }
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displaySeconds = String(seconds).padStart(2, "0");

  return (
    <div className="focus-timer-container">
      <div className="focus-timer-header">
        <h2>Focus Timer</h2>
        <p>Stay focused and productive</p>
      </div>

      <div className="timer-display">
        <div className="timer-time">
          {minutes}:<span>{displaySeconds}</span>
        </div>
      </div>

      <div className="timer-controls">
        <div className="preset-buttons">
          <button className="preset-btn" onClick={() => handleTimerStart(15)}>
            15 mins
          </button>
          <button className="preset-btn" onClick={() => handleTimerStart(25)}>
            25 mins
          </button>
          <button className="preset-btn" onClick={() => handleTimerStart(40)}>
            40 mins
          </button>
        </div>

        <div className="custom-input-group">
          <div className="duration-input-wrapper">
            <div className="duration-input-field">
              <label htmlFor="custom-minutes">Time:</label>
              <input
                id="custom-minutes"
                className="custom-minutes-input"
                type="number"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                min="1"
                max="120"
                placeholder="minutes"
              />
            </div>
            <button className="action-btn reset-btn" onClick={handleTimerReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="action-btn start-btn"
          onClick={() => handleTimerStart(customMinutes)}
        >
          {isRunning ? "Focusing..." : "Start"}
        </button>
      </div>
    </div>
  );
};
