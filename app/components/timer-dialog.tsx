import { useEffect } from "react";
import Button from "./button";
import { TimerComponentState } from "../../types/timer";

interface TimerDialogProps {
  playerNumber: number;
  componentState: TimerComponentState;
  remainingTime: number;
  onClose: () => void;
  onTimeOut?: () => void;
  isReverseMode?: boolean;
}

export default function TimerDialog({
  playerNumber,
  componentState,
  remainingTime,
  onClose,
  onTimeOut,
  isReverseMode = false,
}: TimerDialogProps) {
  // Check for timeout when time reaches 0 in reverse mode
  useEffect(() => {
    if (isReverseMode && componentState.time <= 0 && onTimeOut) {
      onTimeOut();
    }
  }, [componentState.time, isReverseMode, onTimeOut]);
  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 text-center border-2 border-gray-300">
        {componentState.showTimeOut ? (
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-4 text-red-600">TIME OUT!</h2>
            <div className="text-4xl font-bold mb-2">Player {playerNumber}</div>
            <div className="text-lg text-gray-600 mb-4">
              {componentState.isNormalModeComplete
                ? "Time limit reached"
                : "Countdown completed"}
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              Player {playerNumber}
            </h2>
            <div className="text-6xl font-bold font-mono tabular-nums text-gray-900 mb-4 min-w-[300px] text-center">
              {formatTime(componentState.time)}
            </div>
            <div className="text-lg text-gray-600 font-mono tabular-nums">
              Remaining: {formatTime(remainingTime)}
            </div>
          </div>
        )}
        <Button onClick={onClose} variant="primary" size="md">
          Close Timer
        </Button>
      </div>
    </div>
  );
}
