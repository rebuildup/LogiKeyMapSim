"use client";

type Props = {
  lines: string[];
};

export function TransformResultView({ lines }: Props) {
  if (lines.length === 0) return null;

  return (
    <div className="p-4 border border-gray-300">
      <h2 className="text-lg font-bold mb-3">Result</h2>
      <ol className="text-sm list-decimal list-inside">
        {lines.map((line, index) => (
          <li key={`line-${index}`} className="py-1">{line}</li>
        ))}
      </ol>
    </div>
  );
}
