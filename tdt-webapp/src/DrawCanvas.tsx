
import React from "react";
import { useWindowSize, getCanvasSize } from "./helpers";

export interface ImageProvider {
  getImageDataURL: () => string;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
}

type HistoryAction =
  | { kind: "stroke"; stroke: Stroke }
  | { kind: "clear" }
  | { kind: "fill"; point: Point; color: string };

const MAX_UNDO = 20;
const FILL_TOLERANCE = 32;

function getPositionInCanvas(
  canvas: HTMLCanvasElement,
  event: { clientX: number; clientY: number },
): Point {
  const rect = canvas.getBoundingClientRect();
  const canvasSize = getCanvasSize(canvas);

  const scaleX = canvas.width / canvasSize.width;
  const scaleY = canvas.height / canvasSize.height;

  return {
    x: (event.clientX - rect.left - canvasSize.x) * scaleX,
    y: (event.clientY - rect.top - canvasSize.y) * scaleY,
  };
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  point: Point,
  color: string,
  size: number,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  size: number,
) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = size;
  ctx.strokeStyle = color;

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
) {
  if (stroke.points.length === 0) return;

  drawDot(ctx, stroke.points[0], stroke.color, stroke.size);

  for (let i = 1; i < stroke.points.length; i++) {
    drawSegment(
      ctx,
      stroke.points[i - 1],
      stroke.points[i],
      stroke.color,
      stroke.size,
    );
  }
}

function hexToRgb(hex: string) {
  let value = hex.replace("#", "");

  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function floodFill(
  canvas: HTMLCanvasElement,
  point: Point,
  hexColor: string,
): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const width = canvas.width;
  const height = canvas.height;

  const startX = Math.floor(point.x);
  const startY = Math.floor(point.y);

  if (
    startX < 0 ||
    startY < 0 ||
    startX >= width ||
    startY >= height
  ) {
    return false;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const targetIndex = (startY * width + startX) * 4;

  const target = {
    r: data[targetIndex],
    g: data[targetIndex + 1],
    b: data[targetIndex + 2],
    a: data[targetIndex + 3],
  };

  const replacement = hexToRgb(hexColor);

  if (
    target.r === replacement.r &&
    target.g === replacement.g &&
    target.b === replacement.b &&
    target.a === 255
  ) {
    return false;
  }

  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);

  let head = 0;
  let tail = 0;

  const startPixel = startY * width + startX;

  queue[tail++] = startPixel;
  visited[startPixel] = 1;

  const matchesTarget = (pixel: number) => {
    const offset = pixel * 4;

    return (
      Math.abs(data[offset] - target.r) <= FILL_TOLERANCE &&
      Math.abs(data[offset + 1] - target.g) <= FILL_TOLERANCE &&
      Math.abs(data[offset + 2] - target.b) <= FILL_TOLERANCE &&
      Math.abs(data[offset + 3] - target.a) <= FILL_TOLERANCE
    );
  };

  const enqueue = (pixel: number) => {
    if (visited[pixel]) return;

    visited[pixel] = 1;
    queue[tail++] = pixel;
  };

  let changed = false;

  while (head < tail) {
    const pixel = queue[head++];

    if (!matchesTarget(pixel)) continue;

    const offset = pixel * 4;

    data[offset] = replacement.r;
    data[offset + 1] = replacement.g;
    data[offset + 2] = replacement.b;
    data[offset + 3] = 255;

    changed = true;

    const x = pixel % width;
    const y = Math.floor(pixel / width);

    if (x > 0) enqueue(pixel - 1);
    if (x < width - 1) enqueue(pixel + 1);
    if (y > 0) enqueue(pixel - width);
    if (y < height - 1) enqueue(pixel + width);
  }

  if (changed) {
    ctx.putImageData(imageData, 0, 0);
  }

  return changed;
}

const DrawCanvas = ({
  color,
  brushPixelSize,
  fillMode,
  imageProviderRef,
  handleScaleChange,
  onHistoryChange,
}: {
  color: string;
  brushPixelSize: number;
  fillMode: boolean;
  imageProviderRef: React.MutableRefObject<ImageProvider | null>;
  handleScaleChange: (scale: number) => void;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const actionsRef = React.useRef<HistoryAction[]>([]);
  const redoRef = React.useRef<HistoryAction[]>([]);
  const undoFloorRef = React.useRef(0);

  const currentStrokeRef = React.useRef<Stroke | null>(null);
  const activePointerRef = React.useRef<number | null>(null);

  const windowSize = useWindowSize();

  const notifyHistory = React.useCallback(() => {
    onHistoryChange(
      actionsRef.current.length > undoFloorRef.current,
      redoRef.current.length > 0,
    );
  }, [onHistoryChange]);

  const renderCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    actionsRef.current.forEach((action) => {
      if (action.kind === "clear") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (action.kind === "stroke") {
        drawStroke(ctx, action.stroke);
      } else if (action.kind === "fill") {
        floodFill(canvas, action.point, action.color);
      }
    });
  }, []);

  const undo = React.useCallback(() => {
    if (currentStrokeRef.current) return;

    if (actionsRef.current.length <= undoFloorRef.current) {
      return;
    }

    const action = actionsRef.current.pop();
    if (!action) return;

    redoRef.current.push(action);

    renderCanvas();
    notifyHistory();
  }, [renderCanvas, notifyHistory]);

  const redo = React.useCallback(() => {
    if (currentStrokeRef.current) return;

    const action = redoRef.current.pop();
    if (!action) return;

    actionsRef.current.push(action);

    renderCanvas();
    notifyHistory();
  }, [renderCanvas, notifyHistory]);

  const clear = React.useCallback(() => {
    if (currentStrokeRef.current) return;

    actionsRef.current.push({ kind: "clear" });
    redoRef.current = [];

    undoFloorRef.current = Math.max(
      undoFloorRef.current,
      actionsRef.current.length - MAX_UNDO,
    );

    renderCanvas();
    notifyHistory();
  }, [renderCanvas, notifyHistory]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderCanvas();

    imageProviderRef.current = {
      getImageDataURL: () => canvas.toDataURL("image/png"),
      undo,
      redo,
      clear,
    };

    notifyHistory();

    return () => {
      imageProviderRef.current = null;
    };
  }, [
    imageProviderRef,
    undo,
    redo,
    clear,
    renderCanvas,
    notifyHistory,
  ]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasSize = getCanvasSize(canvas);
    const scale = canvasSize.width / canvas.width;

    handleScaleChange(scale);
  }, [windowSize, handleScaleChange]);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (activePointerRef.current !== null) return;

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getPositionInCanvas(canvas, event);

    if (fillMode) {
      const changed = floodFill(canvas, point, color);

      if (changed) {
        actionsRef.current.push({
          kind: "fill",
          point,
          color,
        });

        redoRef.current = [];

        undoFloorRef.current = Math.max(
          undoFloorRef.current,
          actionsRef.current.length - MAX_UNDO,
        );

        notifyHistory();
      }

      return;
    }

    currentStrokeRef.current = {
      points: [point],
      color,
      size: brushPixelSize,
    };

    activePointerRef.current = event.pointerId;

    canvas.setPointerCapture(event.pointerId);

    drawDot(ctx, point, color, brushPixelSize);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getPositionInCanvas(canvas, event);
    const previousPoint = stroke.points[stroke.points.length - 1];

    drawSegment(
      ctx,
      previousPoint,
      point,
      stroke.color,
      stroke.size,
    );

    stroke.points.push(point);
  };

  const finishStroke = (
    event: React.PointerEvent<HTMLCanvasElement>,
    cancelled = false,
  ) => {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    const canvas = event.currentTarget;
    const stroke = currentStrokeRef.current;

    if (!cancelled && stroke) {
      const ctx = canvas.getContext("2d");

      if (ctx) {
        const point = getPositionInCanvas(canvas, event);
        const previousPoint =
          stroke.points[stroke.points.length - 1];

        if (
          point.x !== previousPoint.x ||
          point.y !== previousPoint.y
        ) {
          drawSegment(
            ctx,
            previousPoint,
            point,
            stroke.color,
            stroke.size,
          );

          stroke.points.push(point);
        }
      }
    }

    activePointerRef.current = null;
    currentStrokeRef.current = null;

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (!cancelled && stroke && stroke.points.length > 0) {
      actionsRef.current.push({
        kind: "stroke",
        stroke,
      });

      redoRef.current = [];

      undoFloorRef.current = Math.max(
        undoFloorRef.current,
        actionsRef.current.length - MAX_UNDO,
      );

      notifyHistory();
    } else {
      renderCanvas();
    }
  };

  return (
    <div className="Draw-canvas">
      <canvas
        width="1440"
        height="1080"
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishStroke(event)}
        onPointerCancel={(event) => finishStroke(event, true)}
        style={{
          touchAction: "none",
          cursor: fillMode ? "cell" : "crosshair",
        }}
      />
    </div>
  );
};

export default DrawCanvas;
