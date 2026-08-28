import katex from "katex";

interface TeXProps {
  math: string;
  display?: boolean;
  className?: string;
}

export default function TeX({ math, display = false, className }: TeXProps) {
  const html = katex.renderToString(math, { displayMode: display, throwOnError: false });
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
