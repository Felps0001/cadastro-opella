import { useEffect, useRef } from "react";

export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const previousPointRef = useRef(null);
  const hasSignatureRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    function initializeCanvas() {
      const context = canvas.getContext("2d");
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth || 420;
      const height = 180;

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2.5;
      context.strokeStyle = "#10261a";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      hasSignatureRef.current = false;
      onChange("");
    }

    initializeCanvas();
    window.addEventListener("resize", initializeCanvas);
    return () => window.removeEventListener("resize", initializeCanvas);
  }, [onChange]);

  function pointFromEvent(event) {
    const bounds = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  function startDrawing(event) {
    event.preventDefault();
    const point = pointFromEvent(event);
    const context = canvasRef.current.getContext("2d");
    drawingRef.current = true;
    hasSignatureRef.current = true;
    previousPointRef.current = point;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function draw(event) {
    if (!drawingRef.current) return;
    const point = pointFromEvent(event);
    const context = canvasRef.current.getContext("2d");
    context.beginPath();
    context.moveTo(previousPointRef.current.x, previousPointRef.current.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    previousPointRef.current = point;
  }

  function finishDrawing() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    previousPointRef.current = null;
    onChange(
      hasSignatureRef.current ? canvasRef.current.toDataURL("image/png") : "",
    );
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.clientWidth, 180);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.clientWidth, 180);
    hasSignatureRef.current = false;
    onChange("");
  }

  return (
    <div className="signature-wrap">
      <canvas
        className="signature-pad"
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
        onPointerLeave={finishDrawing}
        onPointerCancel={finishDrawing}
      />
      <button
        type="button"
        className="btn btn--ghost signature-clear"
        onClick={clearSignature}
      >
        Limpar assinatura
      </button>
    </div>
  );
}
