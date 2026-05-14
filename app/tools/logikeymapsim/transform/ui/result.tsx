"use client";

type Props = {
  lines: string[];
};

export function TransformResultView({ lines }: Props) {
  if (lines.length === 0) return <section><h2>Result</h2><p>No result</p></section>;

  return (
    <section>
      <h2>Result</h2>
      <ol>
        {lines.map((line, index) => (
          <li key={`line-${index}`}>{line}</li>
        ))}
      </ol>
    </section>
  );
}
