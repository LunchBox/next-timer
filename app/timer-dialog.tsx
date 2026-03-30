import Button from "./button";

interface TimerDialogProps {
  playerNumber: number;
  time: number;
  remainingTime: number;
  onClose: () => void;
}

export default function TimerDialog({
  playerNumber,
  time,
  remainingTime,
  onClose,
}: TimerDialogProps) {
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
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Player {playerNumber}</h2>
          <div className="text-6xl font-bold font-mono text-gray-900 mb-4">
            {formatTime(time)}
          </div>
          <div className="text-lg text-gray-600">
            Remaining: {formatTime(remainingTime)}
          </div>
        </div>
        <Button onClick={onClose} variant="primary" size="md">
          Close Timer
        </Button>
      </div>
    </div>
  );
}
