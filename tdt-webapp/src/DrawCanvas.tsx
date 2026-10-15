
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
  | { kind: "clear" };

const MAX_UNDO = 20;

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

const DrawCanvas = ({
  color,
  brushPixelSize,
  imageProviderRef,
  handleScaleChange,
  onHistoryChange,
}: {
  color: string;
  brushPixelSize: number;
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

    // Limpa o canvas para reconstruir o desenho.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reproduz todas as ações registradas.
    actionsRef.current.forEach((action) => {
      if (action.kind === "clear") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        drawStroke(ctx, action.stroke);
      }
    });
  }, []);

  const undo = React.useCallback(() => {
    // Não permite desfazer enquanto estiver desenhando.
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

    // Registra a limpeza como uma única ação.
    actionsRef.current.push({ kind: "clear" });

    // Uma nova ação invalida o histórico de refazer.
    redoRef.current = [];

    // Mantém as últimas 20 ações disponíveis para desfazer.
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

    // Somente botão esquerdo do mouse.
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const canvas = event.currentTarget;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = getPositionInCanvas(canvas, event);

    currentStrokeRef.current = {
      points: [point],
      color,
      size: brushPixelSize,
    };

    activePointerRef.current = event.pointerId;

    canvas.setPointerCapture(event.pointerId);

    // Permite desenhar apenas clicando, sem arrastar.
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

    // Desenha incrementalmente para melhorar o desempenho.
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
        const previousPoint = stroke.points[stroke.points.length - 1];

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
      // Cada traço completo é uma ação do histórico.
      actionsRef.current.push({
        kind: "stroke",
        stroke,
      });

      // Descarta ações de refazer após um novo traço.
      redoRef.current = [];

      undoFloorRef.current = Math.max(
        undoFloorRef.current,
        actionsRef.current.length - MAX_UNDO,
      );

      notifyHistory();
    } else {
      // Remove visualmente traços cancelados.
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
        style={{ touchAction: "none" }}
      />
    </div>
  );
};

export default DrawCanvas;
