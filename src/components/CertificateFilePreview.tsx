import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask } from "pdfjs-dist";
import { version } from "pdfjs-dist/package.json";
import type { CertificateFile } from "../data/certifications";
import { resolveMediaUrl } from "../context/PortfolioContext";

const pdfAssets = `${import.meta.env.BASE_URL}pdfjs/${version}/`;

function PdfFirstPage({ url, filename }: { url: string; filename: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let task: PDFDocumentLoadingTask | undefined;
    async function renderPage(canvas: HTMLCanvasElement) {
      try {
        const libraryUrl = pdfAssets + "pdf.min.mjs";
        const pdfjs: typeof import("pdfjs-dist") = await import(/* @vite-ignore */ libraryUrl);
        if (disposed) return;
        pdfjs.GlobalWorkerOptions.workerSrc = pdfAssets + "pdf.worker.min.mjs";
        task = pdfjs.getDocument({
          url, cMapUrl: pdfAssets + "cmaps/", iccUrl: pdfAssets + "iccs/",
          standardFontDataUrl: pdfAssets + "standard_fonts/", wasmUrl: pdfAssets + "wasm/",
        });
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        if (disposed) return;
        const bounds = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 1400 / Math.max(bounds.width, bounds.height) });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, viewport }).promise;
        if (!disposed) setState("ready");
      } catch {
        if (!disposed) setState("error");
      } finally {
        if (!disposed) {
          void task?.destroy();
          task = undefined;
        }
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        void renderPage(canvas);
      }
    }, { rootMargin: "300px" });
    observer.observe(canvas.parentElement!);
    return () => {
      disposed = true;
      observer.disconnect();
      void task?.destroy();
    };
  }, [url]);

  return (
    <a className="certificate-file-preview" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open PDF: ${filename}`}>
      <canvas ref={canvasRef} hidden={state !== "ready"} role="img" aria-label={`First page of ${filename}`} />
      {state === "loading" && <span role="status">Loading certificate preview…</span>}
      {state === "error" && <span>Preview unavailable. Open PDF</span>}
    </a>
  );
}

export function CertificateFilePreview({ file }: { file: CertificateFile }) {
  const url = resolveMediaUrl(file.url);
  const [imageFailed, setImageFailed] = useState(false);
  if (file.mimeType === "application/pdf" || /\.pdf$/i.test(file.filename)) {
    return <PdfFirstPage key={url} url={url} filename={file.filename} />;
  }
  if (!imageFailed && (file.mimeType?.startsWith("image/") || /\.(avif|bmp|gif|ico|jpe?g|jfif|png|svg|webp)$/i.test(file.filename))) {
    return (
      <a className="certificate-file-preview" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${file.filename}`}>
        <img src={url} alt={`Certificate image: ${file.filename}`} loading="lazy" onError={() => setImageFailed(true)} />
      </a>
    );
  }
  return <a className="eligibility-file-link" href={url} target="_blank" rel="noopener noreferrer">{file.filename}</a>;
}
